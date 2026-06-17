import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    onAuthStateChanged, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getDatabase, ref, set, get, push, onValue, update, remove, runTransaction
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCCJCAxbv9bQXz0OY5pPxkSqyDN8bToE34",
    authDomain: "royna-4439a.firebaseapp.com",
    databaseURL: "https://royna-4439a-default-rtdb.firebaseio.com",
    projectId: "royna-4439a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

let balance = parseFloat(localStorage.getItem('trcase_balance')) || 1000;
let inventory = JSON.parse(localStorage.getItem('trcase_inventory')) || [];
let currentUsername = '';
let lastDroppedItem = null;
let currentCaseId = null;
const itemWidth = 150;

let myTradeSelection = [];
let theirTradeSelection = [];
let targetTradeUser = null;

let battleSelectedCases = [];
let currentBattleId = null;
let battleUnsubscribe = null;
let battleRunning = false;

const casesData = {
    starter: {
        id: "starter", name: "Başlangıç Kasası", price: 0, cssClass: "case-starter",
        items: [
            { name: "P250 | Sand Dune", category: "Tabancalar", price: 2, rarity: "r-blue", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwjFU0OGvZqBSLPmUBnPelesn5-RrSXDlwRhx5TjSwtmocCifPwQpDpshReBfsxPrk4DhNu3jshue1dy8VcXxuA", chance: 65 },
            { name: "Glock-18 | Candy Apple", category: "Tabancalar", price: 15, rarity: "r-blue", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1I4M28baBSLPmUBnPelb93teA-FivjzB5wsjzTyI2pIn_CPAMoW8N3ROJZshm5w9zgNbnk5xue1dyMA9ZU_Q", chance: 25 },
            { name: "M4A4 | Magnesium", category: "Taramalılar", price: 55, rarity: "r-purple", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6afBSI_icHneV09FxuO56Wxa_nBovp3OAzo2vdHPFPFUmCJRxRbNZ4xewx9W1Nb7j4gzXg99Ayy73iC1Aun1q_a9cBiEfMG3G", chance: 8 },
            { name: "AK-47 | Slate", category: "Taramalılar", price: 500, rarity: "r-red", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSMOKcCGKD0ud5vuBlcCW6khUz_W3Sytb4cCqTOFUpWJtzTOUD5hPsw9a0Yrnrs1SK3ooXzy6shilM5311o7FVYrIufmI", chance: 2 }
        ]
    },
    case25: {
        id: "case25", name: "Acemi Kasası", price: 25, cssClass: "case-25",
        items: [
            { name: "MP7 | Bloodsport", category: "Taramalılar", price: 8, rarity: "r-blue", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf-jFk4uL5V6ZhL_-XHXef0_pJvOhuRz39lxsk4W3Ry96pIHrFOgElDZN2Q-9etUSwk4LnYu3h5wLejYwWxSr43zQJsHiIGMoJQA", chance: 50 },
            { name: "AWP | Phobos", category: "Keskin Nişancı", price: 35, rarity: "r-purple", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V7RlL_KcHVicyOl-pK84GXHmwk115D6GzdqudHyUbwRxW5R3ROZbtEG8wYDiY7-x5VOKgotB02yg2bdJjfAf", chance: 35 },
            { name: "M4A1-S | Cyrex", category: "Taramalılar", price: 160, rarity: "r-pink", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_uV_vO1WTCa9kxQ1vjiBpYPwJiPTcFB2Xpp5TO5cskG9lYCxZu_jsVCL3o4Xnij23ClO5ik9tegFA_It8qHJz1aWe-uc160", chance: 13 },
            { name: "USP-S | Kill Confirmed", category: "Tabancalar", price: 850, rarity: "r-red", img: "https://app.skin.land/market_images/13460_b.png", chance: 1.5 },
            { name: "★ Navaja Knife | Vanilla", category: "Bıçaklar", price: 2600, isGold: true, rarity: "r-gold", img: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQh5hlcX0nvUOGsx8DdQBJjIAVHubSaIAlp1fb3diRS_8WJnoGInPz6Or3U2D0D7sBw3bGTrdSi2gLl-0puYz_0INCcdwBqaF2DrgTqkum815G57ZvXiSw0f6rRBF0", chance: 0.5 }
        ]
    },
    case50: {
        id: "case50", name: "Uzman Kasası", price: 50, cssClass: "case-50",
        items: [
            { name: "P90 | Asiimov", category: "Taramalılar", price: 20, rarity: "r-blue", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-JaV-KfmeAXGvzedxuPUnTSjikRgksjuBzoz4dXLFb1QoC8QlTLQD4EPqk4LvN-Pns1aMioNBzTK-0H3gQVv65g", chance: 45 },
            { name: "Desert Eagle | Mecha Industries", category: "Tabancalar", price: 65, rarity: "r-purple", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk6OGRbKFsJ_yWMWqVwuZ3j-1gSCGn20h042vSyY2tdyjCZwIlXJBxQeNe4EWxxoHkMOq0sQGIid5Fnyr42HtXrnE8p4gbgvE", chance: 35 },
            { name: "AK-47 | Neon Rider", category: "Taramalılar", price: 320, rarity: "r-pink", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlV6poL_6sHG6UxPxJvOhuRz39xkQhsTnVzoygdy7Ea1UoCZQkRe9bs0brl9TvN-m0tVHYjY5CyS35jjQJsHhk4o5zcA", chance: 17 },
            { name: "M4A4 | The Emperor", category: "Taramalılar", price: 1300, rarity: "r-red", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6afBSJf2DC3Wf09F6ueZhW2exwBh_6m3dnt36InjDPQ4oXJt1TbJeshW_mtfjN-vrsgaKiokWy333kGoXuRj4z9Nd", chance: 1.5 },
            { name: "★ Flip Knife | Tiger Tooth", category: "Bıçaklar", price: 7200, isGold: true, rarity: "r-gold", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d4_u-V6VjH-SaCWKC_uFkse9uSha_nBovp3OBztqpI3yTbAIgDZslQbFbtUbuw9y2Y7y37gDcjooQxH__h39B5yxt_a9cBoXwL4KP", chance: 1 }
        ]
    },
    case100: {
        id: "case100", name: "Seçkin Kasa", price: 100, cssClass: "case-100",
        items: [
            { name: "Glock-18 | Water Elemental", category: "Tabancalar", price: 35, rarity: "r-blue", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK72fB3aFxP11te99cCW6khUz_TjVyompc3-QOFR2DJQkFOMJtBbqk9LlY-7n5QLZjtkTxCWqhixPv311o7FVIf8eASQ", chance: 45 },
            { name: "AWP | Asiimov", category: "Keskin Nişancı", price: 125, rarity: "r-purple", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6V-Kf2cGFidxOp_pewnF3nhxEt0sGnSzN76dH3GOg9xC8FyEORftRe-x9PuYurq71bW3d8UnjK-0H0YSTpMGQ", chance: 35 },
            { name: "AK-47 | Vulcan", category: "Taramalılar", price: 620, rarity: "r-pink", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uJ_t-l9AXCxxEh14zjTztivci2ePQZ2W8NzTecD4BKwloLiYeqxtAOIj9gUyyngznQeF7I6QE8", chance: 17 },
            { name: "M4A1-S | Printstream", category: "Taramalılar", price: 2600, rarity: "r-red", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj_F7Rienhgk1tjyIpYPwJiPTcAAoCpsiEO5ZsUbpm9C2Zuni4VHW3o5EzSX62HxP7Sg96-hWVqYi_6TJz1aW0nxrkGs", chance: 1.5 },
            { name: "★ Karambit | Fade", category: "Bıçaklar", price: 25000, isGold: true, rarity: "r-gold", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SD1iWwOpzj-1gSCGn20tztm_UyIn_JHKUbgYlWMcmQ-ZcskSwldS0MOnntAfd3YlMzH35jntXrnE8SOGRGG8", chance: 1 }
        ]
    },
    case200: {
        id: "case200", name: "Galaksi Kasası", price: 200, cssClass: "case-200",
        items: [
            { name: "Glock-18 | Moonrise", category: "Tabancalar", price: 40, rarity: "r-blue", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a7s2pZKtuK8_CVliF0-x3vt5kQCa9qhsipTiXpYPwJiPTcANzXJNyFOEMthXsktHhMLzl4FaK3toWn3iqhi9BvHw9su5UU6Zw-_bJz1aWcX-Jd_0", chance: 45 },
            { name: "M4A4 | Spider Lily", category: "Taramalılar", price: 140, rarity: "r-purple", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6V6JhL-eWHHSvzedxuPUnHXiwlk4lsTvUz477ICiRPw52WJNxROICtxK-wYDhZejm5gCP2I9MzjK-0H1trtkVHA", chance: 35 },
            { name: "USP-S | Orion", category: "Tabancalar", price: 900, rarity: "r-pink", img: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo6m1FBRp3_bGcjhQ09-jq5WYh8jnI7LFkGJD7fp9g-7J4cL23lexqhI9ZT3wd4WTJ1VvZ1rZr1G2wu2805W46p6amnJj6SEmt3_YgVXp1sALRvj2", chance: 17 },
            { name: "M4A4 | Eye of Horus", category: "Taramalılar", price: 4000, rarity: "r-red", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6afBSMvGsAm6Xyfo46eU5H3DnlxlytTyDwtr_JHmQZw4hC5R5RrRbtRO5xtCyZrzktgCI2ZUFk3sFC5kC3A", chance: 1.5 },
            { name: "★ M9 Bayonet | Doppler", category: "Bıçaklar", price: 12000, isGold: true, rarity: "r-gold", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Wts2sab1iLvWHMWad_up5oPFlSjuMhRUmoDjUpYPwJiPTcA8nCcZ1EOcDu0Lum9CzZO6w4Fbeg4wQxX392ykb6yc4troKAPIm-6fJz1aWPFsIQnE", chance: 1 }
        ]
    },
    case300: {
        id: "case300", name: "İnferno Kasası", price: 300, cssClass: "case-300",
        items: [
            { name: "SG 553 | Aloha", category: "Taramalılar", price: 50, rarity: "r-blue", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLimcO1qx1I_829b_E-c8-SAmiYwNF6ueZhW2fjxE5x5W_SnNz8eXmQaVN2WJUmF7RZuhS8wYbiZeO04VPa3YlCmHr7kGoXuWs6bs2V", chance: 45 },
            { name: "P250 | Inferno", category: "Tabancalar", price: 180, rarity: "r-purple", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiVI0OL8PfRSKf6VC3WeztF6ueZhW2e3wUgi6z7WmI6gc3LDPQAgXsB2E7Veshbpl4DiNL_htQDZ2NlHy3qvkGoXuXYeEedL", chance: 35 },
            { name: "Desert Eagle | Blaze", category: "Tabancalar", price: 3200, rarity: "r-pink", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7vORbqhsLfWAMWuZxuZi_uI_TX6wxxkjsGXXnImsJ37COlUoWcByEOMOtxa5kdXmNu3htVPZjN1bjXKpkHLRfQU", chance: 17 },
            { name: "AK-47 | B the Monster", category: "Taramalılar", price: 8500, rarity: "r-red", img: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0P24bbZ9IeOAMWqfz_1itfNWTiLnwiIqtjmMj4K3IC-Xb1d2WZUmEbMN4xDrmoDlPujktgONjY1HmH_4jCJJ7C454LsHAL1lpPMPrvuW_g", chance: 1.5 },
            { name: "★ Karambit | Crimson Web", category: "Bıçaklar", price: 22000, isGold: true, rarity: "r-gold", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-bF1iHxOxlj-1gSCGn20wi4mTcyoyoeS_Dbwd2Cpd0RrMK4RbqxNTvZLyw7lff3Y5GxX6oiiNXrnE86bQY1_c", chance: 1 }
        ]
    },
    case500: {
        id: "case500", name: "Dust 2 Kasası", price: 500, cssClass: "case-500",
        items: [
            { name: "M4A1-S | Nitro", category: "Taramalılar", price: 80, rarity: "r-blue", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H-OcMWiCwOBxtd5oTCq2mwk0jDGMnYftb3nFaVQgApQiQuEOukS-x4KxP-PjsQOLjt9HzS6t2CpB6C0_4LxWBaA7uvqANEieesU", chance: 45 },
            { name: "AK-47 | Safari Mesh", category: "Taramalılar", price: 220, rarity: "r-purple", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0P-re6xSNPGdMWuZxuZi_rIxSirkkElyt2qEzI2heXiTaVIiX5siROQJtxnul4XnYbvgswOMgolbjXKpnRk9Yjk", chance: 35 },
            { name: "AWP | Atheris", category: "Keskin Nişancı", price: 1100, rarity: "r-pink", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V7JkMPWBMWuZxuZi_rZsS3zgzU8isW3dnIr6eHKfPVAhDpojEe9YsUW4xta1Nuzm5FDci4NbjXKpmWVQppo", chance: 17 },
            { name: "AK-47 | Gold Arabesque", category: "Taramalılar", price: 45000, rarity: "r-red", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSJ_-fCliR0-90tfJ4WiyMmRQguynLntmvICieOARzCpMhF-BYsRe-xoHvYu_g5lSNj4NDyy2viCwY6Hlu5_FCD_Q1jEqYuQ", chance: 1.2 },
            { name: "AWP | Desert Hydra", category: "Keskin Nişancı", price: 35000, rarity: "r-red", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6x0JOKSMWuZxuZi_uA7Syu2w0Ry4mqGzYypeH3DaAEnCpt0FuAK4RjrkoDgMb7mtFfcit5bjXKpX4RFZcA", chance: 0.8 },
            { name: "★ Butterfly Knife | Lore", category: "Bıçaklar", price: 55000, isGold: true, rarity: "r-gold", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsDXKvw_tipOR7SSWqqhEooTi6lob-KT-JZw90XJMiTO8PukW4wIXmN-zq5gXf2tpBm37_2y4auylv5exUAKAi_7qX0V8Ly4BE2w", chance: 1 }
        ]
    },
    case1000: {
        id: "case1000", name: "Efsanevi Kasa", price: 1000, cssClass: "case-1000",
        items: [
            { name: "P250 | Muertos", category: "Tabancalar", price: 150, rarity: "r-blue", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiFO0OL8PfRSLfGdCmacwNF6ueZhW2e1lh51sm3UmN37cHuUbQQhXJtwQO4C4BXsxtHjM-624A3a2IoWySiskGoXuSIJMqiP", chance: 45 },
            { name: "AK-47 | Redline", category: "Taramalılar", price: 600, rarity: "r-purple", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzedxuPUnFniykEtzsWWBzoyuIiifaAchDZUjTOZe4RC_w4buM-6z7wzbgokUyzK-0H08hRGDMA", chance: 40 },
            { name: "AWP | Neo-Noir", category: "Keskin Nişancı", price: 2500, rarity: "r-pink", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6poL_6cB3WvzedxuPUnHirrxR4l423SyI39I3KXPwdxWZclQeNZ5EXskYfnNeyw71OMi9lNzDK-0H3r66pOTw", chance: 12 },
            { name: "M4A4 | Howl", category: "Taramalılar", price: 80000, rarity: "r-red", img: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwT09S5g4yCmfDLP7LWnn8f65Mli7DH9tXziQTgqUY4YmmnINSUJwQ-YVnT_wS7yOzngMW07ZrOmmwj5HeObpQQtA", chance: 1.2 },
            { name: "AWP | Dragon Lore", category: "Keskin Nişancı", price: 150000, rarity: "r-red", img: "https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqYaF7IfysCnWRxuF4j-B-Xxa_nBovp3Pdwtj9cC_GaAd0DZdwQu9fuhS4kNy0NePntVTbjYpCyyT_3CgY5i9j_a9cBkcCWUKV", chance: 0.8 },
            { name: "★ Skeleton Knife | Fade", category: "Bıçaklar", price: 95000, isGold: true, rarity: "r-gold", img: "https://imageproxy.waxpeer.com/insecure/rs:fit:552:385:0/g:nowe/f:webp/plain/https://steamcommunity-a.akamaihd.net/economy/image/class/730/7993038092", chance: 1 }
        ]
    }
};

function getBattleCost(caseIds) {
    return caseIds.reduce((sum, id) => sum + (casesData[id]?.price || 0), 0);
}

function getRandomItem(itemList) {
    const totalChance = itemList.reduce((sum, item) => sum + item.chance, 0);
    let rand = Math.random() * totalChance;
    for (let i = 0; i < itemList.length; i++) {
        if (rand < itemList[i].chance) return itemList[i];
        rand -= itemList[i].chance;
    }
    return itemList[0];
}

function switchScreen(screenId) {
    document.getElementById('home-screen').style.display = screenId === 'cases' ? 'flex' : 'none';
    document.getElementById('items-screen').style.display = screenId === 'items' ? 'block' : 'none';
    document.getElementById('trade-screen').style.display = screenId === 'trades' ? 'flex' : 'none';
    document.getElementById('battle-screen').style.display = screenId === 'battles' ? 'flex' : 'none';
    document.getElementById('battle-screen').classList.toggle('active-flex', screenId === 'battles');
    document.getElementById('inspect-screen').style.display = screenId === 'inspect' ? 'flex' : 'none';
    document.getElementById('nav-tabs-container').style.display = screenId === 'inspect' ? 'none' : 'flex';

    ['tab-cases', 'tab-items', 'tab-trades', 'tab-battles'].forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    if (screenId === 'cases') document.getElementById('tab-cases').classList.add('active');
    if (screenId === 'items') document.getElementById('tab-items').classList.add('active');
    if (screenId === 'trades') {
        document.getElementById('tab-trades').classList.add('active');
        loadMyTradeInv();
    }
    if (screenId === 'battles') {
        document.getElementById('tab-battles').classList.add('active');
        refreshBattlePanels();
    }
}

function updateBalance(amount) {
    balance += amount;
    localStorage.setItem('trcase_balance', balance);
    document.getElementById('balance').innerText = balance;
    if (auth.currentUser) {
        update(ref(database, 'users/' + auth.currentUser.uid), { balance });
    }
}

function saveInventory() {
    localStorage.setItem('trcase_inventory', JSON.stringify(inventory));
    if (auth.currentUser) {
        update(ref(database, 'users/' + auth.currentUser.uid), { inventory });
    }
}

async function syncDataToFirebase(uid, username) {
    currentUsername = username;
    await update(ref(database, 'users/' + uid), { username, inventory, balance });
    await set(ref(database, 'usernames/' + username.toLowerCase()), uid);
}

function renderHome() {
    const home = document.getElementById('home-screen');
    home.innerHTML = '';
    Object.values(casesData).forEach(c => {
        const priceText = c.price === 0 ? 'BEDAVA' : `${c.price} TL`;
        const priceClass = c.price === 0 ? 'case-price free' : 'case-price';
        const card = document.createElement('div');
        card.className = 'case-card';
        card.innerHTML = `
            <div class="case-style ${c.cssClass}"></div>
            <h2 style="margin-top: 15px;">${c.name}</h2>
            <div class="${priceClass}">${priceText}</div>`;
        card.addEventListener('click', () => inspectCase(c.id));
        home.appendChild(card);
    });
}

function renderCatalogItems() {
    const container = document.getElementById('items-screen');
    container.innerHTML = '';
    const categories = ['Tabancalar', 'Taramalılar', 'Keskin Nişancı', 'Bıçaklar'];
    categories.forEach(cat => {
        const catBlock = document.createElement('div');
        catBlock.className = 'category-block';
        catBlock.innerHTML = `<div class="category-title">${cat}</div><div class="category-items-wrapper" id="cat-wrap-${cat}"></div>`;
        container.appendChild(catBlock);
    });
    Object.values(casesData).forEach(c => {
        c.items.forEach(item => {
            const wrapper = document.getElementById(`cat-wrap-${item.category || 'Taramalılar'}`);
            if (!wrapper) return;
            const el = document.createElement('div');
            el.className = `catalog-item ${item.rarity}`;
            el.innerHTML = `
                <img src="${item.img}" alt="">
                <div class="item-title">${item.name}</div>
                <div class="item-price">${item.price} TL</div>
                <div class="item-case">📦 ${c.name}</div>`;
            wrapper.appendChild(el);
        });
    });
}

function inspectCase(caseId) {
    currentCaseId = caseId;
    const currentCase = casesData[caseId];
    switchScreen('inspect');
    document.getElementById('inspect-case-img').className = `case-style ${currentCase.cssClass}`;
    const footerItems = document.getElementById('footer-items');
    footerItems.innerHTML = '';
    currentCase.items.forEach(item => {
        footerItems.innerHTML += `
            <div class="footer-item ${item.rarity}">
                <img src="${item.img}" alt="">
                <span>${item.name}</span>
            </div>`;
    });
}

function openCase() {
    const currentCase = casesData[currentCaseId];
    if (!currentCase) return;
    if (balance < currentCase.price) {
        alert(`Yetersiz Bakiye! Bu kasayı açmak için ${currentCase.price} TL gerekiyor.`);
        return;
    }
    updateBalance(-currentCase.price);
    document.getElementById('open-btn').disabled = true;
    document.getElementById('inspect-case-img').style.display = 'none';
    const wrapper = document.getElementById('roulette-wrapper');
    const track = document.getElementById('roulette-track');
    wrapper.style.display = 'block';
    track.innerHTML = '';
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';

    const winningIndex = 50;
    const winner = getRandomItem(currentCase.items);
    lastDroppedItem = winner;

    for (let i = 0; i < 90; i++) {
        const displayItem = i === winningIndex ? winner : currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
        track.innerHTML += `
            <div class="roulette-item ${displayItem.rarity}">
                <img src="${displayItem.img}" alt="">
                <div class="item-name">${displayItem.name}</div>
            </div>`;
    }

    const wrapperWidth = wrapper.offsetWidth;
    const targetX = (winningIndex * itemWidth) - (wrapperWidth / 2) + (itemWidth / 2);
    const finalScroll = targetX + (Math.floor(Math.random() * 80) - 40);

    setTimeout(() => {
        track.style.transition = 'transform 5s cubic-bezier(0.1, 0.7, 0.1, 1)';
        track.style.transform = `translateX(-${finalScroll}px)`;
    }, 50);

    setTimeout(() => {
        document.getElementById('reward-img').src = lastDroppedItem.img;
        document.getElementById('reward-title').innerText = lastDroppedItem.name;
        document.getElementById('reward-price').innerText = `${lastDroppedItem.price} TL`;
        document.getElementById('reward-title').style.color = lastDroppedItem.rarity === 'r-gold' ? '#caaa13' : '#fff';
        document.getElementById('reward-modal').style.display = 'flex';
    }, 5200);
}

function resetInspectScreen() {
    document.getElementById('inspect-case-img').style.display = 'flex';
    document.getElementById('roulette-wrapper').style.display = 'none';
    document.getElementById('open-btn').disabled = false;
}

function goHome() {
    resetInspectScreen();
    switchScreen('cases');
    currentCaseId = null;
}

function sellItem() {
    updateBalance(lastDroppedItem.price);
    document.getElementById('reward-modal').style.display = 'none';
    resetInspectScreen();
    pushToLiveDrops(lastDroppedItem);
}

function keepItem() {
    inventory.push({ ...lastDroppedItem });
    saveInventory();
    document.getElementById('reward-modal').style.display = 'none';
    resetInspectScreen();
    renderInventory();
    pushToLiveDrops(lastDroppedItem);
}

function toggleInventory() {
    const modal = document.getElementById('inventory-modal');
    if (modal.style.display === 'flex') modal.style.display = 'none';
    else { modal.style.display = 'flex'; renderInventory(); }
}

function renderInventory() {
    const grid = document.getElementById('inv-grid');
    grid.innerHTML = '';
    inventory.forEach((item, index) => {
        const itemContainer = document.createElement('div');
        itemContainer.className = `inv-item ${item.rarity}`;
        itemContainer.innerHTML = `
            <img src="${item.img}" alt="">
            <span>${item.name}</span>
            <div style="color:#00f5d4;font-size:12px;margin-bottom:5px;">${item.price} TL</div>`;
        const sellBtn = document.createElement('button');
        sellBtn.className = 'inv-sell-btn';
        sellBtn.innerText = 'SAT';
        sellBtn.addEventListener('click', () => {
            updateBalance(item.price);
            inventory.splice(index, 1);
            saveInventory();
            renderInventory();
        });
        itemContainer.appendChild(sellBtn);
        grid.appendChild(itemContainer);
    });
}

function pushToLiveDrops(item) {
    if (!auth.currentUser) return;
    if (item.price >= 50 || item.rarity === 'r-gold' || item.rarity === 'r-red') {
        const dropRef = push(ref(database, 'global_drops'));
        set(dropRef, {
            username: currentUsername,
            itemName: item.name,
            itemImg: item.img,
            itemPrice: item.price,
            time: Date.now()
        });
    }
}

function listenLiveDrops() {
    const tooltip = document.getElementById('drop-tooltip');
    onValue(ref(database, 'global_drops'), (snapshot) => {
        const data = snapshot.val();
        const track = document.getElementById('live-drops-track');
        track.innerHTML = '';
        if (!data) {
            track.innerHTML = '<span style="color:#888;padding:0 20px;">Henüz büyük drop yok — kasa aç!</span>';
            return;
        }
        const topDrops = Object.values(data)
            .sort((a, b) => (b.itemPrice || 0) - (a.itemPrice || 0))
            .slice(0, 10);

        function makeDropEl(d) {
            const el = document.createElement('div');
            el.className = 'drop-item';
            el.title = 'Sağ tık: kime çıktığını gör';
            el.innerHTML = `
                <img src="${d.itemImg}" alt="">
                <span>${d.itemName}</span>
                <span class="drop-price">${d.itemPrice || 0} TL</span>`;
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                tooltip.innerHTML = `<strong style="color:#00f5d4;">${d.username}</strong> çıkardı<br>${d.itemName}<br><span style="color:#ffaa00;">${d.itemPrice || 0} TL</span>`;
                tooltip.classList.add('show');
                tooltip.style.left = (e.clientX + 10) + 'px';
                tooltip.style.top = (e.clientY + 10) + 'px';
            });
            return el;
        }
        topDrops.forEach(d => track.appendChild(makeDropEl(d)));
        topDrops.forEach(d => track.appendChild(makeDropEl(d)));
    });
}

document.addEventListener('click', () => {
    document.getElementById('drop-tooltip').classList.remove('show');
});

/* --- TAKAS --- */
async function searchTradeUser() {
    const nick = document.getElementById('trade-username-input').value.trim();
    if (!nick) { alert('Bir kullanıcı adı yaz!'); return; }
    if (nick.toLowerCase() === currentUsername.toLowerCase()) {
        alert('Kendine takas atamazsın!');
        return;
    }
    try {
        const uidSnap = await get(ref(database, 'usernames/' + nick.toLowerCase()));
        if (!uidSnap.exists()) {
            alert('Kullanıcı bulunamadı! Tam nick yazdığından emin ol.');
            return;
        }
        const uid = uidSnap.val();
        const userSnap = await get(ref(database, 'users/' + uid));
        if (!userSnap.exists()) {
            alert('Kullanıcı verisi bulunamadı.');
            return;
        }
        const data = userSnap.val();
        targetTradeUser = { uid, username: data.username, inventory: data.inventory || [] };
        document.getElementById('target-user-title').innerText = `${data.username} - Eşyaları`;
        document.getElementById('trade-arena').style.display = 'flex';
        document.getElementById('btn-send-trade').style.display = 'block';
        myTradeSelection = [];
        theirTradeSelection = [];
        renderTradeArenas();
    } catch (err) {
        alert('Arama hatası: ' + err.message);
    }
}

function loadMyTradeInv() {
    myTradeSelection = [];
    theirTradeSelection = [];
    targetTradeUser = null;
    document.getElementById('trade-arena').style.display = 'none';
    document.getElementById('btn-send-trade').style.display = 'none';
}

function renderTradeArenas() {
    const myDiv = document.getElementById('my-trade-inv');
    const theirDiv = document.getElementById('their-trade-inv');
    myDiv.innerHTML = '';
    theirDiv.innerHTML = '';

    if (inventory.length === 0) {
        myDiv.innerHTML = '<div style="color:#888;font-size:12px;">Envanterin boş.</div>';
    }
    inventory.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = `trade-item ${item.rarity} ${myTradeSelection.includes(index) ? 'selected' : ''}`;
        el.innerHTML = `<img src="${item.img}"><span>${item.name}</span>`;
        el.onclick = () => {
            if (myTradeSelection.includes(index)) myTradeSelection = myTradeSelection.filter(i => i !== index);
            else myTradeSelection.push(index);
            renderTradeArenas();
        };
        myDiv.appendChild(el);
    });

    if (!targetTradeUser) return;
    if ((targetTradeUser.inventory || []).length === 0) {
        theirDiv.innerHTML = '<div style="color:#888;font-size:12px;">Karşı tarafın envanteri boş.</div>';
    }
    targetTradeUser.inventory.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = `trade-item ${item.rarity} ${theirTradeSelection.includes(index) ? 'selected' : ''}`;
        el.innerHTML = `<img src="${item.img}"><span>${item.name}</span>`;
        el.onclick = () => {
            if (theirTradeSelection.includes(index)) theirTradeSelection = theirTradeSelection.filter(i => i !== index);
            else theirTradeSelection.push(index);
            renderTradeArenas();
        };
        theirDiv.appendChild(el);
    });
}

async function sendTrade() {
    if (!targetTradeUser) return;
    if (myTradeSelection.length === 0 && theirTradeSelection.length === 0) {
        alert('Takas edilecek eşya seçilmedi!');
        return;
    }
    const tradeData = {
        fromUid: auth.currentUser.uid,
        fromUser: currentUsername,
        toUid: targetTradeUser.uid,
        toUser: targetTradeUser.username,
        offerItems: myTradeSelection.map(i => inventory[i]),
        requestItems: theirTradeSelection.map(i => targetTradeUser.inventory[i]),
        createdAt: Date.now()
    };
    try {
        await set(push(ref(database, 'trades')), tradeData);
        alert('Takas teklifi başarıyla gönderildi!');
        loadMyTradeInv();
    } catch (err) {
        alert('Takas gönderilemedi: ' + err.message);
    }
}

function listenIncomingTrades() {
    onValue(ref(database, 'trades'), (snapshot) => {
        const list = document.getElementById('incoming-trades-list');
        list.innerHTML = '';
        let hasTrade = false;
        if (snapshot.exists()) {
            snapshot.forEach(childSnap => {
                const trade = childSnap.val();
                if (trade.toUser === currentUsername) {
                    hasTrade = true;
                    const offerText = (trade.offerItems || []).map(i => i.name).join(', ') || 'Hiçbir şey';
                    const reqText = (trade.requestItems || []).map(i => i.name).join(', ') || 'Hiçbir şey';
                    const row = document.createElement('div');
                    row.className = 'trade-request';
                    row.innerHTML = `
                        <div style="font-size:12px;">
                            <b style="color:#00f5d4;">${trade.fromUser}</b> sana takas yolladı.<br>
                            <span style="color:#4caf50">Verdiği:</span> ${offerText}<br>
                            <span style="color:#e63946">İstediği:</span> ${reqText}
                        </div>
                        <div class="trade-actions">
                            <button class="btn-accept">Kabul Et</button>
                            <button class="btn-reject">Reddet</button>
                        </div>`;
                    row.querySelector('.btn-accept').onclick = () => acceptTrade(childSnap.key, trade);
                    row.querySelector('.btn-reject').onclick = () => rejectTrade(childSnap.key);
                    list.appendChild(row);
                }
            });
        }
        if (!hasTrade) {
            list.innerHTML = '<div style="color:#888;font-size:12px;margin-top:10px;">Şu an bekleyen teklif yok.</div>';
        }
    });
}

async function acceptTrade(tradeId, trade) {
    try {
        if (trade.requestItems?.length) {
            trade.requestItems.forEach(reqItem => {
                const idx = inventory.findIndex(i => i.name === reqItem.name && i.price === reqItem.price);
                if (idx > -1) inventory.splice(idx, 1);
            });
        }
        if (trade.offerItems?.length) {
            trade.offerItems.forEach(item => inventory.push({ ...item }));
        }
        saveInventory();
        renderInventory();
        await remove(ref(database, 'trades/' + tradeId));
        alert('Takas kabul edildi! Envanter güncellendi.');
    } catch (err) {
        alert('Takas hatası: ' + err.message);
    }
}

async function rejectTrade(tradeId) {
    await remove(ref(database, 'trades/' + tradeId));
    alert('Takas reddedildi.');
}

/* --- KASA SAVAŞLARI --- */
function initBattleUI() {
    const picker = document.getElementById('battle-case-picker');
    picker.innerHTML = '';
    Object.values(casesData).forEach(c => {
        const chip = document.createElement('div');
        chip.className = 'battle-case-chip';
        chip.textContent = `${c.name} (${c.price === 0 ? 'Bedava' : c.price + ' TL'})`;
        chip.onclick = () => {
            battleSelectedCases.push(c.id);
            renderBattleSelectedCases();
        };
        picker.appendChild(chip);
    });
    renderBattleSelectedCases();
}

function renderBattleSelectedCases() {
    const container = document.getElementById('battle-selected-cases');
    container.innerHTML = '';
    battleSelectedCases.forEach((caseId, idx) => {
        const c = casesData[caseId];
        const tag = document.createElement('div');
        tag.className = 'battle-selected-tag';
        tag.innerHTML = `${idx + 1}. ${c.name} <button type="button">×</button>`;
        tag.querySelector('button').onclick = () => {
            battleSelectedCases.splice(idx, 1);
            renderBattleSelectedCases();
        };
        container.appendChild(tag);
    });
    document.getElementById('battle-total-cost').innerText =
        `Toplam maliyet: ${getBattleCost(battleSelectedCases)} TL (kişi başı)`;
}

function refreshBattlePanels() {
    if (currentBattleId) {
        document.getElementById('battle-list-panel').style.display = 'none';
    } else {
        document.getElementById('battle-list-panel').style.display = 'block';
        document.getElementById('battle-lobby-panel').style.display = 'none';
        document.getElementById('battle-active-panel').style.display = 'none';
    }
}

async function createBattle() {
    if (battleSelectedCases.length === 0) {
        alert('En az bir kasa ekle!');
        return;
    }
    const maxPlayers = parseInt(document.getElementById('battle-max-players').value, 10);
    const cost = getBattleCost(battleSelectedCases);
    if (balance < cost) {
        alert(`Yetersiz bakiye! Bu savaş için ${cost} TL gerekiyor.`);
        return;
    }

    const battleRef = push(ref(database, 'battles'));
    const battleId = battleRef.key;
    const battleData = {
        hostUid: auth.currentUser.uid,
        hostUsername: currentUsername,
        maxPlayers,
        cases: [...battleSelectedCases],
        players: [{ uid: auth.currentUser.uid, username: currentUsername }],
        playerResults: {},
        status: 'waiting',
        currentRound: 0,
        totalCost: cost,
        createdAt: Date.now()
    };
    battleData.playerResults[auth.currentUser.uid] = { drops: [], totalValue: 0 };

    try {
        await set(battleRef, battleData);
        currentBattleId = battleId;
        battleSelectedCases = [];
        renderBattleSelectedCases();
        subscribeToBattle(battleId);
        alert('Savaş oluşturuldu! Bekleme odasındasın.');
    } catch (err) {
        alert('Savaş oluşturulamadı: ' + err.message);
    }
}

function listenOpenBattles() {
    onValue(ref(database, 'battles'), (snapshot) => {
        const listEl = document.getElementById('open-battles-list');
        if (currentBattleId) return;
        listEl.innerHTML = '';
        let found = false;
        if (snapshot.exists()) {
            const battles = [];
            snapshot.forEach(child => {
                const b = child.val();
                if (b.status === 'waiting') battles.push({ id: child.key, ...b });
            });
            battles.sort((a, b) => b.createdAt - a.createdAt);
            battles.forEach(b => {
                found = true;
                const caseNames = b.cases.map(id => casesData[id]?.name || id).join(', ');
                const row = document.createElement('div');
                row.className = 'battle-list-item';
                const isIn = (b.players || []).some(p => p.uid === auth.currentUser?.uid);
                row.innerHTML = `
                    <div>
                        <b style="color:#00f5d4;">${b.hostUsername}</b> savaşı<br>
                        <span style="color:#888;font-size:12px;">${b.players.length}/${b.maxPlayers} oyuncu · ${b.cases.length} kasa · ${b.totalCost} TL/kişi</span><br>
                        <span style="color:#666;font-size:11px;">${caseNames}</span>
                    </div>`;
                if (isIn) {
                    const btn = document.createElement('button');
                    btn.className = 'btn-battle secondary';
                    btn.textContent = 'Odaya Dön';
                    btn.onclick = () => { currentBattleId = b.id; subscribeToBattle(b.id); };
                    row.appendChild(btn);
                } else if ((b.players || []).length < b.maxPlayers) {
                    const btn = document.createElement('button');
                    btn.className = 'btn-battle';
                    btn.textContent = 'Katıl';
                    btn.onclick = () => joinBattle(b.id);
                    row.appendChild(btn);
                }
                listEl.appendChild(row);
            });
        }
        if (!found) {
            listEl.innerHTML = '<div style="color:#888;font-size:12px;">Açık savaş yok. Yukarıdan yeni savaş oluştur!</div>';
        }
    });
}

async function joinBattle(battleId) {
    const cost = getBattleCost(
        (await get(ref(database, 'battles/' + battleId + '/cases'))).val() || []
    );
    if (balance < cost) {
        alert(`Yetersiz bakiye! Katılmak için ${cost} TL gerekiyor.`);
        return;
    }
    try {
        await runTransaction(ref(database, 'battles/' + battleId), (battle) => {
            if (!battle) return battle;
            if (battle.status !== 'waiting') return;
            const already = (battle.players || []).some(p => p.uid === auth.currentUser.uid);
            if (already) return battle;
            if ((battle.players || []).length >= battle.maxPlayers) return;
            battle.players = battle.players || [];
            battle.players.push({ uid: auth.currentUser.uid, username: currentUsername });
            battle.playerResults = battle.playerResults || {};
            battle.playerResults[auth.currentUser.uid] = { drops: [], totalValue: 0 };
            return battle;
        });
        currentBattleId = battleId;
        subscribeToBattle(battleId);
    } catch (err) {
        alert('Katılım hatası: ' + err.message);
    }
}

function subscribeToBattle(battleId) {
    if (battleUnsubscribe) battleUnsubscribe();
    document.getElementById('battle-list-panel').style.display = 'none';
    document.getElementById('battle-lobby-panel').style.display = 'block';

    const battleRef = ref(database, 'battles/' + battleId);
    onValue(battleRef, (snap) => {
        const battle = snap.val();
        if (!battle) {
            leaveBattleLocal();
            return;
        }
        renderBattleLobby(battle);
        if (battle.status === 'running') {
            deductBattleCost(battleId, battle.totalCost || getBattleCost(battle.cases));
            renderBattleActive(battle);
        }
        if (battle.status === 'finished') {
            claimBattleReward(battleId, battle);
            renderBattleFinished(battle);
        }

        if (battle.status === 'waiting' &&
            battle.players.length >= battle.maxPlayers &&
            battle.hostUid === auth.currentUser.uid &&
            !battleRunning) {
            startBattle(battleId, battle);
        }
    });
}

function renderBattleLobby(battle) {
    document.getElementById('battle-lobby-title').innerText =
        `${battle.hostUsername} — Bekleme Odası`;
    document.getElementById('battle-lobby-status').innerText =
        `${battle.players.length} / ${battle.maxPlayers} oyuncu · ${battle.status === 'waiting' ? 'Bekleniyor...' : 'Başlıyor!'}`;
    const slots = document.getElementById('battle-lobby-players');
    slots.innerHTML = '';
    for (let i = 0; i < battle.maxPlayers; i++) {
        const p = battle.players[i];
        const slot = document.createElement('div');
        slot.className = 'battle-player-slot' + (p ? ' filled' : '');
        slot.innerHTML = p ? `<b>${p.username}</b>` : 'Boş Slot';
        slots.appendChild(slot);
    }
    const caseNames = battle.cases.map((id, i) => `${i + 1}. ${casesData[id]?.name}`).join(' → ');
    document.getElementById('battle-lobby-cases').innerText = 'Kasalar: ' + caseNames;
}

function deductBattleCost(battleId, cost) {
    const key = 'trcase_battle_paid_' + battleId;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    updateBalance(-cost);
}

async function startBattle(battleId, battle) {
    battleRunning = true;
    const cost = battle.totalCost || getBattleCost(battle.cases);
    deductBattleCost(battleId, cost);

    const playerResults = {};
    battle.players.forEach(p => {
        playerResults[p.uid] = { username: p.username, drops: [], totalValue: 0 };
    });

    for (let round = 0; round < battle.cases.length; round++) {
        const caseId = battle.cases[round];
        const caseItems = casesData[caseId]?.items || [];
        battle.players.forEach(p => {
            const drop = getRandomItem(caseItems);
            playerResults[p.uid].drops.push(drop);
            playerResults[p.uid].totalValue += drop.price;
            if (p.uid === auth.currentUser.uid) pushToLiveDrops(drop);
        });
        await update(ref(database, 'battles/' + battleId), {
            status: 'running',
            currentRound: round + 1,
            playerResults
        });
        await sleep(2500);
    }

    let winnerUid = battle.players[0].uid;
    let maxVal = playerResults[winnerUid].totalValue;
    battle.players.forEach(p => {
        if (playerResults[p.uid].totalValue > maxVal) {
            maxVal = playerResults[p.uid].totalValue;
            winnerUid = p.uid;
        }
    });

    await update(ref(database, 'battles/' + battleId), {
        status: 'finished',
        winnerUid,
        winnerUsername: playerResults[winnerUid].username,
        playerResults
    });

    battleRunning = false;
}

function claimBattleReward(battleId, battle) {
    const key = 'trcase_battle_reward_' + battleId;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    if (battle.winnerUid !== auth.currentUser.uid) return;
    const allDrops = [];
    Object.values(battle.playerResults || {}).forEach(r => {
        (r.drops || []).forEach(d => allDrops.push({ ...d }));
    });
    allDrops.forEach(d => inventory.push(d));
    saveInventory();
    renderInventory();
}

function renderBattleActive(battle) {
    document.getElementById('battle-lobby-panel').style.display = 'none';
    document.getElementById('battle-active-panel').style.display = 'block';
    document.getElementById('battle-result-banner').style.display = 'none';
    document.getElementById('battle-round-label').innerText =
        `Tur ${battle.currentRound} / ${battle.cases.length}`;

    const grid = document.getElementById('battle-active-grid');
    grid.innerHTML = '';
    const results = battle.playerResults || {};
    let maxVal = Math.max(...Object.values(results).map(r => r.totalValue || 0), 0);

    Object.entries(results).forEach(([uid, data]) => {
        const card = document.createElement('div');
        const isWinner = uid === battle.winnerUid;
        card.className = 'battle-player-card' +
            (isWinner && battle.status === 'finished' ? ' winner' :
                data.totalValue === maxVal && maxVal > 0 ? ' leading' : '');
        let dropsHtml = (data.drops || []).map(d => `
            <div class="battle-drop-mini ${d.rarity}">
                <img src="${d.img}" alt="">
                <span>${d.name} — ${d.price} TL</span>
            </div>`).join('');
        card.innerHTML = `
            <h4 style="color:#00f5d4;margin-bottom:8px;">${data.username || uid}</h4>
            <div style="color:#ffaa00;font-weight:bold;margin-bottom:8px;">Toplam: ${data.totalValue || 0} TL</div>
            ${dropsHtml}`;
        grid.appendChild(card);
    });
}

function renderBattleFinished(battle) {
    renderBattleActive(battle);
    document.getElementById('battle-result-banner').style.display = 'block';
    const isWinner = battle.winnerUid === auth.currentUser.uid;
    document.getElementById('battle-winner-text').innerText =
        isWinner ? '🏆 KAZANDIN!' : `🏆 Kazanan: ${battle.winnerUsername}`;
    document.getElementById('battle-winner-detail').innerText =
        isWinner ? 'Tüm drop\'lar envanterine eklendi!' : 'Bir dahaki sefere!';
}

function leaveBattleLocal() {
    currentBattleId = null;
    battleRunning = false;
    document.getElementById('battle-list-panel').style.display = 'block';
    document.getElementById('battle-lobby-panel').style.display = 'none';
    document.getElementById('battle-active-panel').style.display = 'none';
}

async function leaveBattle() {
    if (!currentBattleId) return;
    const battleId = currentBattleId;
    try {
        await runTransaction(ref(database, 'battles/' + battleId), (battle) => {
            if (!battle || battle.status !== 'waiting') return battle;
            battle.players = (battle.players || []).filter(p => p.uid !== auth.currentUser.uid);
            if (battle.playerResults) delete battle.playerResults[auth.currentUser.uid];
            if (battle.players.length === 0) return null;
            if (battle.hostUid === auth.currentUser.uid && battle.players.length > 0) {
                battle.hostUid = battle.players[0].uid;
                battle.hostUsername = battle.players[0].username;
            }
            return battle;
        });
    } catch (_) { /* ignore */ }
    leaveBattleLocal();
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function finishBattleUI() {
    if (currentBattleId) {
        remove(ref(database, 'battles/' + currentBattleId)).catch(() => {});
    }
    leaveBattleLocal();
}

/* --- AUTH --- */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        document.getElementById('live-drops-wrapper').style.display = 'block';
        currentUsername = user.displayName || user.email.split('@')[0];
        document.getElementById('user-display').innerText = `Ajan ${currentUsername}`;
        document.getElementById('balance').innerText = balance;

        await syncDataToFirebase(user.uid, currentUsername);
        listenLiveDrops();
        listenIncomingTrades();
        listenOpenBattles();
        initBattleUI();

        renderHome();
        renderCatalogItems();
        renderInventory();
        switchScreen('cases');
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('live-drops-wrapper').style.display = 'none';
        currentBattleId = null;
    }
});

document.getElementById('tab-cases').addEventListener('click', () => switchScreen('cases'));
document.getElementById('tab-items').addEventListener('click', () => switchScreen('items'));
document.getElementById('tab-trades').addEventListener('click', () => switchScreen('trades'));
document.getElementById('tab-battles').addEventListener('click', () => switchScreen('battles'));

document.getElementById('btn-signup').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value.trim();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || !username || !password) {
        alert('Kayıt olmak için tüm alanları doldurmalısın!');
        return;
    }
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await set(ref(database, 'users/' + cred.user.uid), { username, balance: 1000, inventory: [] });
        await set(ref(database, 'usernames/' + username.toLowerCase()), cred.user.uid);
        await updateProfile(cred.user, { displayName: username });
        balance = 1000;
        inventory = [];
        localStorage.setItem('trcase_balance', balance);
        localStorage.setItem('trcase_inventory', '[]');
        alert('Başarıyla kayıt oldun! İyi şanslar.');
    } catch (err) {
        alert('Kayıt Hatası: ' + err.message);
    }
});

document.getElementById('btn-signin').addEventListener('click', () => {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || !password) {
        alert('Giriş yapmak için e-posta ve şifreni girmelisin!');
        return;
    }
    signInWithEmailAndPassword(auth, email, password).catch(err => alert('Giriş Hatası: ' + err.message));
});

document.getElementById('btn-signout').addEventListener('click', () => signOut(auth));
document.getElementById('btn-search-user').addEventListener('click', searchTradeUser);
document.getElementById('trade-username-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchTradeUser();
});
document.getElementById('btn-send-trade').addEventListener('click', sendTrade);
document.getElementById('inspect-back-btn').addEventListener('click', goHome);
document.getElementById('open-btn').addEventListener('click', openCase);
document.getElementById('reward-sell-btn').addEventListener('click', sellItem);
document.getElementById('reward-keep-btn').addEventListener('click', keepItem);
document.getElementById('header-inv-btn').addEventListener('click', toggleInventory);
document.getElementById('inv-close-btn').addEventListener('click', toggleInventory);

document.getElementById('battle-tab-list').addEventListener('click', () => {
    document.getElementById('battle-tab-list').classList.add('active');
    document.getElementById('battle-tab-create').classList.remove('active');
    document.getElementById('battle-list-view').style.display = 'block';
    document.getElementById('battle-create-view').style.display = 'none';
});
document.getElementById('battle-tab-create').addEventListener('click', () => {
    document.getElementById('battle-tab-create').classList.add('active');
    document.getElementById('battle-tab-list').classList.remove('active');
    document.getElementById('battle-create-view').style.display = 'block';
    document.getElementById('battle-list-view').style.display = 'none';
});
document.getElementById('btn-create-battle').addEventListener('click', createBattle);
document.getElementById('btn-leave-battle').addEventListener('click', leaveBattle);
document.getElementById('btn-battle-done').addEventListener('click', finishBattleUI);
