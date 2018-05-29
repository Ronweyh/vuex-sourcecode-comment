/**
 * 
 * @param {Vue构造器} Vue 
 */
export default function (Vue) {
  // 判断Vue大版本
  const version = Number(Vue.version.split('.')[0])

  if (version >= 2) {
    // 如果是2.x
    Vue.mixin({ beforeCreate: vuexInit }) // beforeCreate钩子等于每个组件初始化之前都会获取$store
  } else {
    // override init and inject vuex init procedure
    // for 1.x backwards compatibility.
    const _init = Vue.prototype._init // 保存原来的_init函数
    // 重写_init
    Vue.prototype._init = function (options = {}) {
      options.init = options.init
        ? [vuexInit].concat(options.init)
        : vuexInit
      _init.call(this, options)
    }
  }

  /**
   * Vuex init hook, injected into each instances init hooks list.
   */

  function vuexInit () {
    const options = this.$options // options是Vue实例的options
    // store injection
    // 如果有store属性
    if (options.store) {
      // $store = 如果store是函数，说明初始化没有执行，就执行函数
      this.$store = typeof options.store === 'function'
        ? options.store()
        : options.store
    } else if (options.parent && options.parent.$store) { // 如果子组件自身没有store，那么会找到父组件的store属性，多层组件嵌套时等于递归，从顶层往下传递
      this.$store = options.parent.$store
    }
  }
}
