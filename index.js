import { Store, install } from './store'
import { mapState, mapMutations, mapGetters, mapActions, createNamespacedHelpers } from './helpers'

export default {
  Store,
  install,
  version: '__VERSION__',
  mapState,
  mapMutations,
  mapGetters,
  mapActions,
  createNamespacedHelpers
}

/**
 NOTE: 分析实际开发
  import Vuex from 'vuex'
  Vuex === 上面的导出对象
  1. store定义
  new Vuex.Store({
    state: {}
  })

  2. 将会调用上面Store构造器
  
 */
