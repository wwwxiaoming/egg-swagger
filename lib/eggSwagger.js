/* eslint-disable comma-dangle */
/* eslint-disable semi */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-vars */
'use strict';
const fs = require('fs');
const path = require('path');

class eggSwagger {
  constructor(router, option, header) {
    this.defaultOption = {
      swagger: '2.0',
      info: {
        version: '1.0.0',
        title: 'Swagger2.0Api',
      },
      host: option.host,
      basePath: '/',
      tags: [],
      schemes: [ 'http', 'https' ],
      paths: {},
      definitions: {},
      tagsCaches: [ 'api' ],
      securityDefinitions: {},
    };
    this.router = router;
    this.json = { ...this.defaultOption,
    };
    this.header = header
  }
  initSwagger(app) {
    writerSwagger(this.json, this.router, app, this.header);
  }
}

// 写入swagger.json文件
function writerSwagger(json, router, app, header) {
  initTags(router, json);
  writerRouter(router, json, app);
  if (header) {
    initHeader(json, header);
  }
  writerFile(json);
}

// 初始化tags
function initTags(router, json) {
  for (const routers of router) {
    const tags_json = {};
    tags_json.name = routers.tag;
    tags_json.description = routers.description;
    json.tags.push(tags_json);
  }
}
// 初始化header
function initHeader(json, header) {
  for (let item in header) {
    const header_dict = {}
    header_dict['type'] = 'apiKey';
    header_dict['name'] = header[item];
    header_dict['in'] = 'header';
    json.securityDefinitions[item] = header_dict;
    // 在每个router上面写上header
    for (let item2 in json['paths']) {
      for (let item3 in json['paths'][item2]) {
        const header2_dict = {}
        header2_dict[item] = []
        json['paths'][item2][item3].security.push(header2_dict)
      }
    }
  }
}
// 写入router
function writerRouter(router, json, app) {
  for (const routers of router) {
    for (const paths in routers.routers) {
      // 注册路由
      if (routers.routers[paths].hasOwnProperty('middleware')) {
        app.router[routers.routers[paths].method](new RegExp(paths + '$', 'i'), routers.routers[paths].middleware, routers.routers[paths].action);
      } else {
        app.router[routers.routers[paths].method](new RegExp(paths + '$', 'i'), routers.routers[paths].action)
      }
      const path_json = {};
      path_json.tags = [ routers.routers[paths].tag ];
      path_json.summary = routers.routers[paths].summary;
      path_json.description = routers.routers[paths].description;
      const operationId = getOperationId(routers.routers[paths].action);
      path_json.operationId = operationId[2];
      path_json.produces = [ '*/*' ];
      path_json.consumes = [ '*/*' ];
      path_json.parameters = createParameters(operationId[1] + operationId[2], routers.routers[paths]);
      path_json.responses = {
        200: {
          description: 'OK',
        },
        404: {
          description: '404Not Found',
        },
        500: {
          description: 'Server error',
        },
        401: {
          description: 'Your request was rejected',
        },
      };
      if (routers.routers[paths].method === 'get') {
        json.paths[paths] = { get: path_json };
        json.paths[paths].get['security'] = []
      } else if (routers.routers[paths].method === 'post') {
        json.paths[paths] = { post: path_json };
        json.paths[paths].post['security'] = []
      } else if (routers.routers[paths].method === 'put') {
        json.paths[paths] = { put: path_json };
        json.paths[paths].put['security'] = []
      } else if (routers.routers[paths].method === 'delete') {
        json.paths[paths] = { delete: path_json };
        json.paths[paths].delete['security'] = []
      }
      if (routers.routers[paths].hasOwnProperty('data')) {
        json.definitions[operationId[1] + operationId[2]] = writerParamet(operationId[1] + operationId[2], routers.routers[paths], json);
      }
    }
  }
}

// 定义parameters
function createParameters(name, router) {
  const parameters_array = []
  // 写入请求头
  // 判断有没有请求头的出现
  if (router.hasOwnProperty('header')) {
    if (router.header.constructor === Array) {
      for (let item of router.header) {
        let header_dict = {};
        header_dict['name'] = item;
        header_dict['in'] = 'header';
        header_dict['required'] = false;
        header_dict['type'] = 'string';
        parameters_array.push(header_dict);
      }
    } else {
      let header_dict = {};
      header_dict['name'] = router.header;
      header_dict['in'] = 'header';
      header_dict['required'] = false;
      header_dict['type'] = 'string';
      parameters_array.push(header_dict);
    }
  }
  let parameters_json;
  if (router.hasOwnProperty('data')) {
    parameters_json = { in: 'body', name: 'body', description: '', required: true, schema: { $ref: '#/definitions/' + name } };
  } else {
    parameters_json = { in: 'body', name: 'body', description: '', required: true };
  }
  parameters_array.push(parameters_json)
  // 判断有没有query
  if(router.hasOwnProperty('query')) {
    for (let items in router.query) {
      let query_dict = {};
      query_dict['in'] = 'query';
      query_dict['name'] = items;
      query_dict['required'] = router.query[items]
      parameters_array.push(query_dict);
    }
  }
  return parameters_array;
}

// 写入参数
function writerParamet(name, router, json) {
  const definitions_json = {};
  definitions_json['type'] = 'object';
  const data_json = {};
  for (const definitions in router.data) {
    data_json[definitions] = {};
    if (router.data[definitions].constructor === Object) {
      data_json[definitions]['example'] = router.data[definitions].default;
      data_json[definitions]['type'] = router.data[definitions].type;
      data_json[definitions]['description'] = router.data[definitions].description;
      if (router.data[definitions] === 'array' || router.data[definitions] === 'arrayString') {
        data_json[definitions]['xml'] = { name: definitions, wrapped: true };
        data_json[definitions]['items'] = { type: 'string' };
      } else if (router.data[definitions] === 'arrayNumber') {
        data_json[definitions]['xml'] = { name: definitions, wrapped: true };
        data_json[definitions]['items'] = { type: 'string' };
      }
    } else {
      data_json[definitions]['type'] = router.data[definitions];
      data_json[definitions]['format'] = router.data[definitions];
      if (router.data[definitions] === 'array' || router.data[definitions] === 'arrayString') {
        data_json[definitions]['xml'] = { name: definitions, wrapped: true };
        data_json[definitions]['items'] = { type: 'string' };
      } else if (router.data[definitions] === 'arrayNumber') {
        data_json[definitions]['xml'] = { name: definitions, wrapped: true };
        data_json[definitions]['items'] = { type: 'string' };
      }
    }
  }
  definitions_json['properties'] = data_json;
  definitions_json['xml'] = name;
  return definitions_json;
}


function getOperationId(action) {
  const identify = Object.getOwnPropertySymbols(action);
  const str_model = action[identify[0]];
  const patt = /\#(.*)\.(.*)\(\)/;
  return patt.exec(str_model);
}

// 写入文件
function writerFile(json) {
  const file_path = path.join(__dirname, '../app/public/swagger/swagger.json');
  fs.writeFile(file_path, JSON.stringify(json), { flag: 'w', encoding: 'utf-8' }, function(err) {});
}

module.exports = eggSwagger;
