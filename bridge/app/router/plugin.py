from starlette.responses import JSONResponse
from starlette.responses import PlainTextResponse

def get_pool(app):
    return app.state.magellan_pool

async def list_plugins(request):
    lst = list()
    p = dict()
    p["name"] = "MyPlugin"
    p["version"] = "0.1"
    p["description"] = "This is a test plugin"
    p["author"] = "Me"
    p["license"] = "MIT"
    p["url"] = "/plugin/facility_standards"
    p["plug_point"] = "facility_standards"
    lst.append(p)
    return JSONResponse(lst)

async def get_plugin(request):
    name = [request.query_params[name] for name in ['name']][0]
    p = """
import React, { useEffect } from 'react';
import PluginInterface from './PluginInterface';

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const MyUI = ({ start, onStop }) => {
  useEffect(() => {
    if (!start) {
      return;
    }
    sleep(3000).then(() => {
      onStop();
    });
  }, [start]);

  return start ? (
    <div style={{ padding: '32px' }}>Plugin is running</div>
  ) : (
    <div>Plugin is not running</div>
  );
};

class MyPlugin extends PluginInterface {
  constructor() {
    super();
  }

  get name() {
    return 'MyPlugin';
  }

  get plugPoint() {
    return this.plugPoint;
  }

  init() {
    console.log('App Message Plugin initialized');
  }

  render(props) {
    return <MyUI {...props} />;
  }
}

export default MyPlugin;"""
    return await PlainTextResponse(p)