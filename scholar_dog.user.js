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
// @run-at      document-start
// ==/UserScript==

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
    // switch (key) {}
    switch (key) {
        case "ccf":
            return "CCF " + value;
        case "cssci":
            return value;
        // case "zhongguokejihexin":
        //     return "中国科技核心";
        // case "pku":
        //     return "北大中文核心"
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
    getTrList() {
        return document.querySelectorAll("table.result-table-list tbody tr");
    },
    getJournalName(tr) {
        return tr.querySelector("td.source").textContent;
    },
    insertFlag(tr) {
        const flag = document.createElement("span");
        flag.className = "ScholarDogFlag";
        tr.querySelector("td.name").appendChild(flag);
    },
};

async function run() {
    // 根据网址
    let cite;
    if (location.href.includes("cnki")) {
        cite = cnki;
    } else {
        return;
    }

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

    GM_registerMenuCommand("查询期刊等级（shift + F）", async () => {
        await run();
    });

    // 添加快捷键自动查询
    document.addEventListener("keydown", async (event) => {
        if (event.key === "F") {
            await run();
        }
    });
})();
