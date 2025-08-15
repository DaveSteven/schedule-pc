// import { strToObj } from "utils";
import axios from "axios";
// import JSBridge from "utils/JSBridge";
// import { Dialog } from "vant";
// import { reLogin, setUrl } from "utils/useLogin";
import { getMockDataByPath } from "@/mock/data";
import { strToObj } from "./index";

const JSBridge = {
  callHandler: (method: string, params: any, callback: (res: any) => void) => {
    console.warn("JSBridge not available in mock mode");
    callback(null);
  },
};

const setUrl = (params: any) => {
  console.warn("setUrl not available in mock mode");
};

const reLogin = async (params: any) => {
  console.warn("reLogin not available in mock mode");
  return Promise.reject(new Error("reLogin not available"));
};

let baseURL = import.meta.env.VITE_API_URL;

function request() {
  const mode = import.meta.env.MODE;
  if (mode === "development") {
    const instance = axios.create({
      baseURL,
      timeout: 5000,
    });

    instance.defaults.withCredentials = true;

    instance.interceptors.request.use((config: any) => {
      // 开发环境指定用户
      config.headers.set("userId", "744123");
      config.headers.set("sys-code", "RCGL", true);
      return config;
    });

    instance.interceptors.response.use((response) => {
      const { data } = response;
      const { status } = data;
      if (Number(status) === 0) {
        return Promise.resolve(data);
      } else {
        sessionStorage.removeItem("isLogin");
        //Dialog.alert({ message: data.errorInfo });
        return Promise.reject(data);
      }
    });

    return instance;
  } else if (mode === "mock") {
    // Mock 模式：返回自定义的请求函数
    return ({ method = "GET", url = "", data = {}, operType = 0 }: any) => {
      console.log(`Mock 请求地址：${url}`);
      console.log(`Mock 请求参数：${JSON.stringify(data)}`);

      // 获取模拟数据
      const mockResponse = getMockDataByPath(url, data);

      // 模拟网络延迟
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Mock 响应：`, mockResponse);
          resolve(mockResponse);
        }, 300);
      });
    };
  } else {
    const request = ({ method = "GET", url = "", data = {}, operType = 0 }) => {
      console.log(`请求地址：${baseURL}${url}`);
      console.log(`请求参数：${JSON.stringify(data)}`);
      let params = {};
      let requestUrl;
      if (url.includes("getToken")) {
        requestUrl = url;
      } else {
        requestUrl = `${baseURL}${url}`;
      }
      if (operType === 0) {
        params = {
          requestSource: "internetRequest",
          url: requestUrl,
          params: data,
          type: method,
          operType: "0",
          headers: {
            "sys-code": "RCGL",
          },
          cookieSubAppId: "RCGL",
        };
      } else {
        params = {
          requestSource: "internetRequest",
          url: "",
          md: `${baseURL}${url}`,
          sc: "RCGL",
          ac: window.sessionStorage.getItem("samCode"),
          params: data,
          type: method,
          operType: "1",
          headers: {
            "sys-code": "RCGL",
          },
          cookieSubAppId: "RCGL",
        };
      }
      params = JSON.stringify(params);

      return new Promise((resolve, reject) => {
        JSBridge.callHandler("nativeRequest", params, async (res: any) => {
          if (res) {
            console.log(`请求结果：${res}`);
            res = strToObj(res);
            res.url = url;
            if (Number(res.status) === 0) {
              resolve(res);
            } else {
              if (
                res.status === "260010012" ||
                res.status === "21601000" ||
                res.status === "26001023"
              ) {
                sessionStorage.removeItem("isLogin");
                setUrl(params);
                const res = await reLogin(params).catch((err: any) => {
                  reject(err);
                });
                resolve(res);
              }
              reject(res);
            }
          } else {
            reject({ url });
          }
        });
      });
    };
    return request;
  }
}

export default request();
