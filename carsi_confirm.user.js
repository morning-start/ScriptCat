// ==UserScript==
// @name         CARSI 学术认证
// @version      1.1.0
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
            confirmButtonText: "提交",
            showCancelButton: true,
            preConfirm: () => {
                const popup = Swal.getPopup();

                // 正确获取所有字段
                return {
                    firstLetter: popup
                        .querySelector("#carsi-firstLetter")
                        .value.trim(),
                    school: popup.querySelector("#carsi-school").value.trim(),
                    name: popup.querySelector("#carsi-name").value.trim(),
                    pwd: popup.querySelector("#carsi-pwd").value, // 不 trim 密码
                    remUser: popup.querySelector("#carsi-remUser").checked,
                    notCache: popup.querySelector("#carsi-notCache").checked,
                    clearCache: popup.querySelector("#carsi-clearCache").checked,
                    share: popup.querySelector("#carsi-share").value,
                    person: popup.querySelector("#carsi-person").checked,
                };
            },
        });
        console.log(formValues);

        if (formValues) {
            await GM_setValue("info", formValues);
        }
    }
    buildFormInfo(emptyInfo) {
        return `
<form id="infoForm" class="form-card">

    <div class="form-item">
        <label>学校首字母 (firstLetter)</label>
        <input type="text" id="carsi-firstLetter" name="firstLetter" maxlength="1" placeholder="如 A" value="${
            emptyInfo.firstLetter
        }">
    </div>

    <div class="form-item">
        <label>学校 (school)</label>
        <input type="text" id="carsi-school" name="school" placeholder="请输入学校" value="${
            emptyInfo.school
        }">
    </div>

    <div class="form-item">
        <label>姓名 (name)</label>
        <input type="text"  id="carsi-name"  name="name" placeholder="请输入姓名" value="${
            emptyInfo.name
        }">
    </div>

    <div class="form-item">
        <label>密码 (pwd)</label>
        <input type="password" id="carsi-pwd" name="pwd" placeholder="请输入密码" value="${
            emptyInfo.pwd
        }">
    </div>

    <div class="form-item checkbox-group">
        <input type="checkbox" id="carsi-remUser" name="remUser" ${
            emptyInfo.remUser ? "checked" : ""
        }>
        <label for="carsi-remUser">记住用户 (remUser)</label>
    </div>

    <div class="form-item checkbox-group">
        <input type="checkbox" id="carsi-notCache" name="notCache" ${
            emptyInfo.notCache ? "checked" : ""
        }>
        <label for="carsi-notCache">不缓存 (notCache)</label>
    </div>

    <div class="form-item checkbox-group">
        <input type="checkbox" id="carsi-clearCache" name="clearCache" ${
            emptyInfo.clearCache ? "checked" : ""
        }>
        <label for="carsi-clearCache">清除缓存 (clearCache)</label>
    </div>

    <div class="form-item">
        <label>共享范围 (share)</label>
        <select name="share" id="carsi-share">
            <option value="not" ${
                emptyInfo.share === "not" ? "selected" : ""
            }>不共享</option>
            <option value="only" ${
                emptyInfo.share === "only" ? "selected" : ""
            }>仅当前服务</option>
            <option value="all" ${
                emptyInfo.share === "all" ? "selected" : ""
            }>所有服务</option>
        </select>
    </div>

    <div class="form-item checkbox-group">
        <input type="checkbox" id="carsi-person" name="person" ${
            emptyInfo.person ? "checked" : ""
        }>
        <label for="person">个人模式 (person)</label>
    </div>
</form>`;
    }
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
