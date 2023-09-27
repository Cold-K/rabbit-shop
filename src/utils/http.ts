import { useMemberStore } from '@/stores/modules/member'

/**
 *添加拦截器:
 *  拦截request请求
 *  拦截uploadFile文件上传
 *
 * TODD:
 *  1.非http开头需拼接地址
 *  2.请求超时
 *  3.添加小程序端请求标识
 *  4.添加token请求头标识
 */
const baseURL = 'https://pcapi-xiaotuxian-front-devtest.itheima.net'

//添加拦截器
const httpInterceptor = {
  //拦截前触发
  invoke(options: UniApp.RequestOptions) {
    // 1.非http开头需拼接地址
    if (!options.url.startsWith('http')) {
      options.url = baseURL + options.url
    }
    //  2.请求超时
    options.timeout = 10000
    //3.添加小程序端请求标识
    options.header = {
      ...options.header,
      'source-client': 'miniapp',
    }
    //4.添加token请求头标识
    const memberStore = useMemberStore()
    const token = memberStore.profile?.token
    if (token) {
      options.header.Authorization = token
    }
  },
}

uni.addInterceptor('request', httpInterceptor)
uni.addInterceptor('uploadFile', httpInterceptor)

/**
 * 请求函数
 * @param UniApp.RequestOptions
 * @returns Promise
 *  1.返回Promise对象
 *  2.请求成功
 *    2.1提取核心数据res.data
 *    2.2添加类型,支持泛型
 *  3.请求失败
 *    3.1网络错误 -> 提示用户换网络再试
 *    3.2 401错误 -> 清理用户信息,跳转到登录页
 *    3.3 其他错误 -> 根据后端错误信息轻提示
 */
interface Data<T> {
  code: string
  msg: string
  result: T
}
export const http = <T>(options: UniApp.RequestOptions) => {
  //1.返回Promise对象
  return new Promise<Data<T>>((resolve, reject) => {
    uni.request({
      ...options,
      //2.请求成功
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as Data<T>)
        } else if (res.statusCode === 401) {
          // 401错误 -> 清理用户信息,跳转到登录页
          const memberStore = useMemberStore()
          memberStore.clearProfile()
          uni.navigateTo({ url: '/pages/login/login' })
          reject(res)
        } else {
          uni.showToast({
            title: (res.data as Data<T>).msg || '请求错误',
            icon: 'none',
            mask: true,
          })
          reject(res)
        }
      },
      fail(err) {
        uni.showToast({
          title: '网络错误, 请更换网络',
          icon: 'none',
        })
        reject(err)
      },
    })
  })
}
