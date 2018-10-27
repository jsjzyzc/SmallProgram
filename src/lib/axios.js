'use strict'

import axios from 'axios'
import wepyAxiosAdapter from 'wepy-plugin-axios/dist/adapter.js'

const instance = axios.create({
  adapter: wepyAxiosAdapter(axios),
  baseURL: 'http://API_HOST:8070/api',
  headers: {
    'Authorization': undefined
  },
  validateStatus: () => true
})

export default instance

let token = ''
export function getToken () { return token }
export function setToken (newToken) {
  token = newToken
  instance.defaults.headers['Authorization'] = 'Bearer ' + token
}
