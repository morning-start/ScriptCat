// ==UserScript==
// @name         Scholar Dog
// @version      1.0.0
// @license      MIT
// @description  显示期刊CCF等级
// @author       Morning Start
// @match        https://kns.cnki.net/*
// @icon         https://mgmt.carsi.edu.cn/frontend/web/member_files/cxstar.com/%E7%95%85%E6%83%B3%E4%B9%8B%E6%98%9F%E7%94%B5%E5%AD%90%E4%B9%A6-logo2.png
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @namespace    morningstart.scholar_dog
// ==/UserScript==

/**
 * Wait for an element before resolving a promise
 * @param {String} querySelector - Selector of element to wait for
 * @param {Integer} timeout - Milliseconds to wait before timing out, or 0 for no timeout
 */
function waitForElement(querySelector, timeout) {
    return new Promise((resolve, reject) => {
        var timer = false;
        if (document.querySelectorAll(querySelector).length) return resolve();
        const observer = new MutationObserver(() => {
            if (document.querySelectorAll(querySelector).length) {
                observer.disconnect();
                if (timer !== false) clearTimeout(timer);
                return resolve();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
        if (timeout)
            timer = setTimeout(() => {
                observer.disconnect();
                reject();
            }, timeout);
    });
}

function createSpanNode(tag, backgroundColor, textColor) {
    let span = document.createElement("span");
    // span.className = "easyscholar-ranking";
    //
    span.textContent = tag;
    span.style.backgroundColor = backgroundColor;
    span.style.color = textColor;
    span.style.fontSize = "13px";
    span.style.marginLeft = "5px";
    span.style.marginRight = "5px";
    span.style.fontFamily = '"Times New Roman", sans-serif';
    span.style.borderRadius = "9px";
    span.style.whiteSpace = "nowrap";
    span.style.padding = "3px 9px 2px";
    return span;
}
function formatterTag(key, value) {
    const data_map = {
        swufe: "西南财经大学",
        cufe: "中央财经大学",
        uibe: "对外经济贸易大学",
        sdufe: "山东财经大学",
        xdu: "西安电子科技大学",
        swjtu: "西南交通大学",
        ruc: "中国人民大学",
        xmu: "厦门大学",
        sjtu: "上海交通大学",
        fdu: "复旦大学",
        hhu: "河海大学",
        scu: "四川大学",
        cqu: "重庆大学",
        nju: "南京大学",
        xju: "新疆大学",
        cug: "中国地质大学",
        cju: "长江大学",
        zju: "浙江大学",
        zhongguokejihexin: "中国科技核心期刊",
        fms: "FMS",
        utd24: "UTD24",
        eii: "EI检索",
        cssci: "南大核心",
        pku: "北大核心",
        cpu: "中国药科大学",
        sciif: "SCI影响因子-JCR",
        sci: "SCI分区-JCR",
        ssci: "SSCI分区-JCR",
        jci: "JCI指数-JCR",
        sciif5: "SCI五年影响因子-JCR",
        sciwarn: "中科院预警",
        sciBase: "SCI基础版分区-中科院",
        sciUp: "SCI升级版分区-中科院",
        ajg: "ABS学术期刊指南",
        ft50: "FT50",
        cscd: "中国科学引文数据库",
        ahci: "A&HCI",
        sciUpSmall: "中科院升级版小类分区",
        sciUpTop: "中科院升级版Top分区",
        esi: "ESI学科分类",
        ccf: "中国计算机学会",
    };
    // switch (key) {}
    switch (key) {
        case "pku":
            return "北核";
        case "ccf":
            return "CCF " + value;
        case "cssci":
            return value;
        case "zhongguokejihexin":
            return "中科核";
        case "sci":
            return "SCI " + value;
        case "ssci":
            return "SSCI " + value;
        case "sciif":
            return "SCI-IF " + value;
        case "sciBase":
            return "SCI-Base " + value;
        case "sciUp":
            return "SCI-Up " + value;
        case "jci":
            return "JCI " + value;
        case "sciUpTop":
            return "SCI-UpTop " + value;
        case "eii":
            return "EI检索";
        default:
            return;
    }
}

async function fetchJournalInfo(journalName, secretKey) {
    // GET
    let url =
        "https://www.easyscholar.cc/open/getPublicationRank?secretKey=" +
        secretKey +
        "&publicationName=" +
        journalName;
    let response = await fetch(url);
    let json = await response.json();
    // 获取数据 字典形式 类似
    let data = json.data.officialRank.select;
    // 使用formatterTag，处理key，value
    let tags = Object.entries(data).map(([key, value]) => {
        return formatterTag(key, value);
    });
    // tags 删除 null
    tags = tags.filter((tag) => tag);
    return tags;
}
function addSpanNodes(flag, tags) {
    let colors = [
        "rgba(255, 102, 102, 1)",
        "rgba(255, 153, 51, 1)",
        "rgba(255, 204, 0, 1)",
        "rgba(153, 204, 0, 1)",
        "rgba(51, 204, 51, 1)",
        "rgba(0, 204, 153, 1)",
        "rgba(0, 204, 204, 1)",
        "rgba(0, 153, 255, 1)",
    ];

    let textColor = "rgba(255, 255, 255, 1)";

    // 修复：正确创建并插入节点
    let fragment = document.createDocumentFragment();
    tags.forEach((tag, index) => {
        let spanNode = createSpanNode(
            tag,
            colors[index % colors.length],
            textColor
        );
        fragment.appendChild(spanNode);
    });
    // 插入 tags 到 flag 后面
    flag.parentNode.insertBefore(fragment, flag.nextSibling);
}

const cnki = {
    resultTitle: "#gridTable",
    getTrList() {
        return document.querySelectorAll("table.result-table-list tbody tr");
    },
    getJournalName(tr) {
        return tr.querySelector("td.source").textContent;
    },
    insertFlag(tr) {
        const flag = document.createElement("span");
        flag.className = "ScholarDogFlag";
        // 后面添加兄弟结点
        tr.querySelector("td.name a").after(flag);
    },
};

async function run(cite) {
    const api_key = GM_getValue("API_KEY", "");
    // 查找 table.result-table-list 然后对其中 每个tr的 td.source 的文本。为一个期刊名
    let tr_list = cite.getTrList();
    // 从索引1开始遍历
    if (!tr_list.length) {
        return;
    }
    for (let tr of tr_list) {
        cite.insertFlag(tr);
        let journalName = cite.getJournalName(tr);

        let flag = tr.querySelector("span.ScholarDogFlag");
        let tags = await fetchJournalInfo(journalName, api_key);
        addSpanNodes(flag, tags);
    }
}

(async function () {
    "use strict";
    GM_registerMenuCommand("保存API_KEY", async () => {
        // 使用弹窗输入API_KEY
        let { value: api_key } = await Swal.fire({
            title: "请输入API_KEY",
            input: "text",
            inputLabel: "API_KEY",
            inputPlaceholder: "请输入API_KEY",
            defaultValue: GM_getValue("API_KEY", ""),
            showCancelButton: true,
            confirmButtonText: "保存",
            cancelButtonText: "取消",
            focusConfirm: false,
        });
        GM_setValue("API_KEY", api_key);
    });
    let cite;
    if (location.href.includes("cnki")) {
        cite = cnki;
    } else {
        return;
    }
    // waitForElement(cite.resultTitle).then(async () => {
    //     await run(cite);
    // });
    // 快捷键
    document.addEventListener("keydown", async (event) => {
        if (event.key === "F") {
            await run(cite);
        }
    });
})();
