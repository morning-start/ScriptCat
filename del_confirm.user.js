// ==UserScript==
// @name         Git Del Confirm
// @version      2.2.0
// @license      MIT
// @description  删除仓库自动填写库名，支持 github、gitee
// @author       Morning Start
// @match        https://gitee.com/*
// @match        https://github.com/*
// @icon         https://ts3.tc.mm.bing.net/th/id/ODF.KCStyvubJszELPE98QcMBA?w=32&h=32&qlt=90&pcl=fffffc&o=6&cb=thwsc4&pid=1.2
// @namespace    morningstart.del-confirm
// ==/UserScript==

(function () {
    ("use strict");
    const currentURL = window.location.href;
    setInterval(() => {
        if (currentURL.includes("gitee.com")) {
            giteeConfirm();
        } else if (currentURL.includes("github.com")) {
            githubConfirm();
        }
    }, 1000);
})();

function githubConfirm() {
    let del_btn = document.querySelector(
        "#dialog-show-repo-delete-menu-dialog"
    );

    del_btn.addEventListener("click", function () {
        const intervalId = setInterval(() => {
            const ipt = document.querySelector("#verification_field");
            const targetButton = document.getElementById(
                "repo-delete-proceed-button"
            );
            if (targetButton && !ipt) {
                // 若元素存在，点击该按钮
                targetButton.click();
                const button3 = document.getElementById(
                    "repo-delete-proceed-button"
                );
                const intervalCheck = setInterval(() => {
                    if (
                        button3.querySelector(".Button-label").textContent ===
                        "Delete this repository"
                    ) {
                        // 清除定时器，停止检查
                        clearInterval(intervalId);
                        clearInterval(intervalCheck);
                        // 若按钮已禁用，解除禁用
                        button3.disabled = false;
                        // 填写库名
                        let warp = document.querySelector(
                            "#repo-delete-proceed-button-container"
                        );
                        let text = warp.querySelector(".FormControl-label");
                        let input = warp.querySelector("#verification_field");
                        const regex = /"([^"]*)"/;
                        const match = text.textContent.match(regex);
                        input.value = match[1];
                    }
                }, 200);
            }
        }, 500);
        // console.log("button1");
    });
}

function giteeConfirm() {
    let del_btn = document.querySelector(".del-pro-btn");
    del_btn.addEventListener("click", function () {
        let wrap = document.querySelector(".del-or-clear-target-wrap");
        wrap.querySelector(".ok").className = "ui button orange ok";
        let text = wrap.querySelector(".highlight-black");
        let input = wrap.querySelector("#path_with_namespace");
        input.value = text.textContent;
    });
}
