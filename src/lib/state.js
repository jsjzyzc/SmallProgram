'use strict'

import wepy from 'wepy'
import { formatDate } from '../lib/util'
import axios, { setToken } from '../lib/axios'
import { $modal, $loading } from '../lib/wepy'

const state = {
  code: '',
  scene: null,
  fontSize: wx.getStorageSync('font-size') || 'normal',
  userinfo: {}
}

export default state
wepy.component.prototype.$state = state

export function unexceptedError (err) {
  // TODO: 上报错误
  $modal('错误', `小程序遇到了无法处理的错误，请退出再打开小程序试试。若错误持续出现，请联系我们。\n${err}`)
}

export function login () {
  return _login().catch(err => unexceptedError(err))
}

async function _login () {
  let code
  let codee
  await $loading('正在加载...')

  if (state.code && await wepy.checkSession()) code = state.code
  else code = (await wepy.login()).code     // TODO: 错误处理

  const userinfo = await wepy.getUserInfo().catch(() => {})
  const user = {loginParam: 'administrator', password: 'administrator'}
  if (!userinfo) return false

  const WhetherBind = (await axios.post('wechat/whetherBind', { user })).data
  if (WhetherBind.state === 1) {
    // 获取请求 token
    const bind = (await axios.post('wechat/bind', {code, user})).data
    if (bind.state === 1) {
      console.log('绑定成功')
    } else {
      throw new Error(`绑定错误: ${bind.message} (${bind.state})`)
    }
  } else {
    wx.request({
      url: 'http://localhost:8070/api/wechatLogin',
      method: 'POST',
      data: {'code': code},
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log(res)
        wx.setStorageSync('sessionid', res.header['set-cookie'])
        console.log('ok')
      }
    })
  //   const token = (await axios.post('wechatLogin', {code})).data
  //   if (token.state === 1) {
  //     console.log(wx.getStorageSync('sessionid'))
  //     // setToken(token.data)
  //   } else {
  //     console.log(wx.getStorageSync('sessionid'))
  //     throw new Error(`登录错误: ${token.message} (${token.state})`)
  //   }
  // }
  // 获取并储存用户信息
  // const userinfoDetail = (await axios.get('userinfo')).data
  // if (userinfoDetail.code) {
  //   setToken('')
  //   throw new Error(`无法获取用户信息: ${userinfoDetail.message} (${userinfoDetail.code})`)
  // } else {
  //   updateUserinfo({
  //     ...userinfo.userInfo,
  //     ...userinfoDetail.data
  //   })
  // }

  await $loading()
  return true
}

export function updateUserinfo (userinfo) {
  userinfo.birthday = userinfo.birthday ? formatDate(userinfo.birthday) : null
  userinfo.diseases = userinfo.diseases
    .map(disease => {
      disease.onset = new Date(disease.onset)
      return disease
    })
    .sort((a, b) => a.onset - b.onset)
    .map(disease => {
      disease.onset = formatDate(disease.onset)
      return disease
    })

  state.userinfo = userinfo
  return userinfo
}
