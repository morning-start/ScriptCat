// ==UserScript==
// @name         CARSI 学术认证
// @version      1.0.0
// @license      MIT
// @description  自动登录 CARSI，去除繁琐确认
// @author       Morning Start
// @match        https://ds.carsi.edu.cn/*
// @match        https://idp.*.edu.cn/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand

// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @icon         https://ts1.tc.mm.bing.net/th/id/ODF.OZvxenMn9xHD_Lempvp2YQ?w=32&h=32&qlt=97&pcl=fffffa&o=6&cb=thwsc4&pid=1.2
// @namespace    morningstart.carsi
// ==/UserScript==

/**
 * Core类封装了所有CARSI认证相关的功能
 */
class Core {
    constructor({
        firstLetter,
        school,
        name,
        pwd,
        remUser,
        notCache,
        clearCache,
        share,
        person,
    }) {
        this.info = {
            firstLetter,
            school,
            name,
            pwd,
            remUser,
            notCache,
            clearCache,
            share,
            person,
        };
        this.currentURL = window.location.href;
    }

    /**
     * 执行相应的操作基于当前URL
     */
    execute() {
        if (this.currentURL.includes("login/index.html")) {
            this.login(
                this.info.firstLetter.charAt(0).toUpperCase(),
                this.info.school
            );
        } else if (this.currentURL.includes("profile")) {
            let header = document.querySelector("h1");
            if (header) {
                let text = header.textContent;
                if (text.includes("登陆")) {
                    this.profile(
                        this.info.name,
                        this.info.pwd,
                        this.info.notCache,
                        this.info.clearCache
                    );
                } else if (text.includes("隐私")) {
                    this.privacy(true);
                } else if (text.includes("Information Release")) {
                    this.shareInfo(this.info.share);
                }
            }
        } else if (this.currentURL.includes("resource.php")) {
            if (this.info.person) {
                this.person();
            }
        }
    }

    /**
     * 登录函数
     * @param {string} idx - 学校名称首字母
     * @param {string} schoolName - 学校名称
     */
    login(idx, schoolName) {
        let tracker = document.querySelectorAll(".tracker-item > a");
        // 寻找 text 为 schoolName 的首字拼音
        //   schoolName 的首字拼音
        for (let i = 0; i < tracker.length; i++) {
            if (tracker[i].text == idx) {
                tracker[i].click();
                break;
            }
        }
        // 等待页面加载完成

        window.addEventListener("load", () => {
            let schoolList = document.querySelectorAll(".schoolList1 > li");
            for (let i = 0; i < schoolList.length; i++) {
                if (schoolList[i].textContent.includes(schoolName)) {
                    schoolList[i].click();
                    break;
                }
            }
        });
        // 记住用户 #remUserSelect
        if (this.info.keep_data) {
            document.querySelector("#remUserSelect").click();
        }
        window.addEventListener("load", () => {
            document.querySelector("#idpSkipButton").click();
        });
    }

    /**
     * 填写用户信息
     * @param {string} name - 用户名
     * @param {string} pwd - 密码
     * @param {boolean} notCache - 是否不缓存
     * @param {boolean} clearCache - 是否清除缓存
     */
    profile(name, pwd, notCache, clearCache) {
        let username = document.querySelector("#username");
        let password = document.querySelector("#password");
        username.value = name;
        password.value = pwd;
        if (notCache) {
            document.querySelector("label[for='donotcache']").click();
        }
        if (clearCache) {
            document
                .querySelector("label[for='_shib_idp_revokeConsent']")
                .click();
        }

        window.addEventListener("load", () => {
            document.querySelector(".grid-item > button").click();
        });
    }

    /**
     * 隐私声明处理
     * @param {boolean} accept - 是否接受
     */
    privacy(accept) {
        if (accept) {
            document.querySelector("label[for='accept']").click();
        }
        window.addEventListener("load", () => {
            document.querySelector(".grid-item > button").click();
        });
    }

    /**
     * 信息分享设置
     * @param {string} share - 分享选项(not, only, all)
     */
    shareInfo(share) {
        // share 有三个选项
        // not
        // only
        // all
        if (share === "not") {
            document
                .querySelector("label[for='_shib_idp_doNotRememberConsent']")
                .click();
        } else if (share === "only") {
            document
                .querySelector("label[for='_shib_idp_rememberConsent']")
                .click();
        } else if (share === "all") {
            document
                .querySelector("label[for='_shib_idp_globalConsent']")
                .click();
        }
        window.addEventListener("load", () => {
            document.querySelector(".grid-item > button").click();
        });
    }

    /**
     * 个人操作处理
     */
    person() {
        document.querySelector(".user_operation a").click();
    }
}

class Menu {
    execute() {
        GM_registerMenuCommand("设置info", () => {
            this.setInfo();
        });
    }
    async setInfo() {
        let emptyInfo = GM_getValue("info", {
            firstLetter: "",
            school: "",
            name: "",
            pwd: "",
            remUser: true,
            notCache: false,
            clearCache: false,
            // share 有三个选项 not only all
            share: "all",
            person: false,
        });

        /* 工具函数：把布尔值转成 checked 字符串 */
        const { value: formValues } = await Swal.fire({
            title: "编辑 emptyInfo",
            html: this.buildFormInfo(emptyInfo),
            focusConfirm: false,
            confirmButtonText: "确认",
            showCancelButton: true,
            preConfirm: () => {
                /* 2. 把表单里的数据读出来 */
                return {
                    firstLetter: document
                        .getElementById("firstLetter")
                        .value.trim(),
                    school: document.getElementById("school").value.trim(),
                    name: document.getElementById("name").value.trim(),
                    pwd: document.getElementById("pwd").value,
                    remUser: document.getElementById("remUser").checked,
                    notCache: document.getElementById("notCache").checked,
                    clearCache: document.getElementById("clearCache").checked,
                    share: document.getElementById("share").value,
                    person: document.getElementById("person").checked,
                };
            },
        });
        if (formValues) {
            GM_setValue("info", formValues);
        }
    }
    buildFormInfo(emptyInfo) {
        const ck = (v) => (v ? "checked" : "");

        return `<table style="width:100%;font-size:14px">
        <tr><td>学校拼音首字母</td><td><input class="swal2-input" style="width:90%" id="firstLetter" maxlength="1" value="${
            emptyInfo.firstLetter
        }"></td></tr>
        <tr><td>学校全称</td><td><input class="swal2-input" style="width:90%" id="school" value="${
            emptyInfo.school
        }"></td></tr>
        <tr><td>账号</td><td><input class="swal2-input" style="width:90%" id="name" value="${
            emptyInfo.name
        }"></td></tr>
        <tr><td>密码</td><td><input class="swal2-input" style="width:90%" id="pwd" type="password" value="${
            emptyInfo.pwd
        }"></td></tr>
        <tr><td>学校信息</td><td ><label><input type="checkbox" id="remUser" ${ck(
            emptyInfo.remUser
        )}> 记住用户</label></td></tr>
        <tr><td>个人信息</td><td ><label><input type="checkbox" id="notCache" ${ck(
            emptyInfo.notCache
        )}> 不缓存</label><label><input type="checkbox" id="clearCache" ${ck(
            emptyInfo.clearCache
        )}> 清除缓存</label></td></tr>
        <tr><td>共享范围</td>
            <td><select id="share" class="swal2-select">
                  <option value="not" ${
                      emptyInfo.share === "not" ? "selected" : ""
                  }>不共享信息</option>
                  <option value="only" ${
                      emptyInfo.share === "only" ? "selected" : ""
                  }>仅当前服务</option>
                  <option value="all" ${
                      emptyInfo.share === "all" ? "selected" : ""
                  }>所有服务</option>
                </select></td></tr>
        <tr><td colspan="2"><label><input type="checkbox" id="person" ${ck(
            emptyInfo.person
        )}> 跳转个人页面</label></td></tr>
      </table>`;
    }
}
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
(function () {
    ("use strict");

    const info = GM_getValue("info", {});
    if (Object.keys(info).length > 0) {
        // 创建Core实例并执行
        const core = new Core(info);
        // 等待页面加载完成
        window.addEventListener("load", () => {
            core.execute();
        });
    }

    const box = new Menu();
    box.execute();
})();
