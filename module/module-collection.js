import Module from './module'
import { assert, forEachValue } from '../util'

// modules收集
export default class ModuleCollection {
  constructor (rawRootModule) { // rawRootModule === store.options 等于new Vuex.Store(options)中的options
    this.register([], rawRootModule, false)
  }

  get (path) {
    // path为数组，module等于上一个累计值，key为path值，this.root为第一次调用的值
    // 等于是一直获取到子module的对象
    return path.reduce((module, key) => {
      return module.getChild(key) // 下一次执行将会把module.getChild(key)作为module传入
    }, this.root)
    /* 
      ex: path = ['register', 'user']
      return: 
          this.root.getChild('register').getChild('user')
     */
  }

  // 假设path = ['login', 'user'], 如果namespaced === true 
  getNamespace (path) {
    let module = this.root
    return path.reduce((namespace, key) => {
      module = module.getChild(key)
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
    // 那么对mutation、action、getter的访问将会是login/user/methodName
  }

  update (rawRootModule) {
    update([], this.root, rawRootModule)
  }

  register (path, rawModule, runtime = true) {
    if (process.env.NODE_ENV !== 'production') {
      assertRawModule(path, rawModule) // 判断定义是否符合要求
    }

    const newModule = new Module(rawModule, runtime)
    if (path.length === 0) {
      this.root = newModule // store的root对象属性和方法
    } else {
      const parent = this.get(path.slice(0, -1)) // 获取到父级module
      parent.addChild(path[path.length - 1], newModule) // 父级module添加子module
    }

    // 递归处理modules深层嵌套
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => { // key === rawModule.modules属性key
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }

  unregister (path) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]
    if (!parent.getChild(key).runtime) return

    parent.removeChild(key)
  }
}

function update (path, targetModule, newModule) {
  if (process.env.NODE_ENV !== 'production') {
    assertRawModule(path, newModule)
  }

  // update target module
  targetModule.update(newModule)

  // update nested modules
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
            'manual reload is needed'
          )
        }
        return
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}

const functionAssert = {
  assert: value => typeof value === 'function',
  expected: 'function'
}

const objectAssert = {
  assert: value => typeof value === 'function' ||
    (typeof value === 'object' && typeof value.handler === 'function'),
  expected: 'function or object with "handler" function'
}

const assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert
}


// 此函数判断getters/mutations/actions三者定义是否符合要求
function assertRawModule (path, rawModule) {
  // 判断getters、mutations、actions
  Object.keys(assertTypes).forEach(key => {
    if (!rawModule[key]) return // 如果没有定义，return

    const assertOptions = assertTypes[key] // 

    forEachValue(rawModule[key], (value, type) => {
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      )
    })
  })
}

function makeAssertionMessage (path, key, type, value, expected) {
  let buf = `${key} should be ${expected} but "${key}.${type}"`
  if (path.length > 0) {
    buf += ` in module "${path.join('.')}"`
  }
  buf += ` is ${JSON.stringify(value)}.`
  return buf
}
