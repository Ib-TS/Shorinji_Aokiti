// --- ゲームの状態管理 ---
let p_hp = 100;
let c_hp = 100;

// プレイヤーの役割: "defender"(守者) または "attacker"(攻者)
let playerRole = "defender"; 

let defenderKamae = ""; // 守者の構え
let attackerKamae = ""; // 攻者の構え

// フェーズ管理: 1=最初の構え選択, 1.5=攻者(プレイヤー)の構え選択, 2=技選択, 3=結果表示
let currentPhase = 1; 

const defenderOptions = ["中段構え", "八相構え", "一字構え", "前手高く"];

// --- 攻防相性データテーブル ---
const battleDatabase = {
    "中段構え_中段構え": {
        attacks: ["内手首掴む", "外手首掴む"],
        defends: ["腕十字", "小手抜", "寄抜", "巻抜", "送小手", "突抜"],
        checkSuccess: (atk, def) => {
            if (atk === "内手首掴む" && ["腕十字", "小手抜"].includes(def)) return true;
            if (atk === "外手首掴む" && ["寄抜", "巻抜", "送小手", "突抜"].includes(def)) return true;
            return false;
        }
    },
    "中段構え_一字構え": {
        attacks: ["上段逆突", "上段振突", "手刀打"],
        defends: ["流水蹴", "内受突", "転身蹴", "上受突", "外受突", "打上突", "外押受突", "内押受突"],
        checkSuccess: (atk, def) => {
            if (atk === "上段逆突" && ["流水蹴", "内受突", "転身蹴", "外受突", "打上突"].includes(def)) return true;
            if (atk === "上段振突" && ["外押受突", "内押受突"].includes(def)) return true;
            if (atk === "手刀打" && def === "上受突") return true;
            return false;
        }
    },
    "中段構え_前手高く": {
        attacks: ["外手首掴む", "内手首掴む"],
        defends: ["切抜（外）", "切抜（内）", "十字抜"],
        checkSuccess: (atk, def) => {
            if (atk === "外手首掴む" && ["切抜（外）", "十字抜"].includes(def)) return true;
            if (atk === "内手首掴む" && def === "切抜（内）") return true;
            return false;
        }
    },
    "一字構え_中段構え": {
        attacks: ["逆蹴"],
        defends: ["横転身蹴", "半転身蹴"],
        checkSuccess: (atk, def) => {
            return true; 
        }
    },
    "一字構え_一字構え": {
        attacks: ["差込廻蹴", "金的蹴"],
        defends: ["十字受蹴", "払受蹴", "金的蹴膝受波返"],
        checkSuccess: (atk, def) => {
            if (atk === "差込廻蹴" && ["十字受蹴", "払受蹴"].includes(def)) return true;
            if (atk === "金的蹴" && def === "金的蹴膝受波返") return true; 
            return false;
        }
    },
    "一字構え_八相構え": {
        attacks: ["中段順突", "中段逆突", "差替中段順突"],
        defends: ["下受蹴", "下受順蹴", "逆転身蹴"],
        checkSuccess: (atk, def) => {
            if (atk === "中段順突" && def === "下受順蹴") return true;
            if (atk === "中段逆突" && def === "下受蹴") return true;
            if (atk === "差替中段順突" && def === "逆転身蹴") return true;
            return false;
        }
    }
};

// --- 画面更新メイン処理 ---
function updateUI(message) {
    if(document.getElementById("game-message")) document.getElementById("game-message").innerText = message;
    if(document.getElementById("p-hp")) document.getElementById("p-hp").innerText = p_hp;
    if(document.getElementById("c-hp")) document.getElementById("c-hp").innerText = c_hp;
    
    const pRoleName = (playerRole === "defender") ? "【守者】" : "【攻者】";
    const cRoleName = (playerRole === "defender") ? "【攻者】" : "【守者】";
    
    document.getElementById("p-kamae").innerText = (playerRole === "defender") ? (defenderKamae ? `${pRoleName} ${defenderKamae}` : "選択中...") : (attackerKamae ? `${pRoleName} ${attackerKamae}` : "選択中...");
    document.getElementById("c-kamae").innerText = (playerRole === "defender") ? (attackerKamae ? `${cRoleName} ${attackerKamae}` : "待機中...") : (defenderKamae ? `${cRoleName} ${defenderKamae}` : "選択中...");

    if (p_hp <= 0 || c_hp <= 0) {
        const winner = p_hp <= 0 ? "相手(CPU)" : "あなた";
        document.getElementById("game-message").innerText = `【勝負あり！】\n勝者: ${winner}`;
        document.getElementById("action-title").innerText = "ゲーム終了";
        document.getElementById("buttons").innerHTML = `<button onclick="resetGame()">最初から遊ぶ</button>`;
        return;
    }

    renderButtons();
}

// --- ボタンの動的生成 ---
function renderButtons() {
    const btnContainer = document.getElementById("buttons");
    const title = document.getElementById("action-title");
    if (!btnContainer || !title) return;
    
    btnContainer.innerHTML = ""; 

    if (currentPhase === 1) {
        if (playerRole === "defender") {
            // プレイヤーが守者の場合：4つの構えから選ぶ
            title.innerText = "【守者のターン】あなたの構えを選んでください（4択）";
            defenderOptions.forEach(kamae => {
                btnContainer.innerHTML += `<button onclick="selectKamaeDefender('${kamae}')">${kamae}</button>`;
            });
        } else {
            // プレイヤーが攻者の場合：まずCPU（守者）に自動で構えを選ばせる
            title.innerText = "【攻者のターン】相手（守者）に構えを選ばせます";
            btnContainer.innerHTML = `<button onclick="cpuSelectKamaeDefender()">相手（守者）に構えを選ばせる</button>`;
        }
    } 
    else if (currentPhase === 1.5) {
        // 【フェーズ1.5：攻者(プレイヤー)の構え選択】
        title.innerText = `相手の構え: [${defenderKamae}] ➔ あなた（攻者）の構えを選んでください`;
        
        let allowedAttackerOptions = [];
        if (defenderKamae === "八相構え") {
            allowedAttackerOptions = ["一字構え"];
        } else if (defenderKamae === "前手高く") {
            allowedAttackerOptions = ["中段構え"];
        } else {
            allowedAttackerOptions = ["中段構え", "一字構え"];
        }

        // ルールで許可された構えボタンだけを画面に出す
        allowedAttackerOptions.forEach(kamae => {
            btnContainer.innerHTML += `<button onclick="selectKamaeAttacker('${kamae}')">${kamae}</button>`;
        });
    }
    else if (currentPhase === 2) {
        // 【フェーズ2：技の選択】
        const battleKey = `${attackerKamae}_${defenderKamae}`;
        const currentSetup = battleDatabase[battleKey];

        if (playerRole === "defender") {
            title.innerText = "【守者】防技を選択してください";
            currentSetup.defends.forEach(waza => {
                btnContainer.innerHTML += `<button onclick="fight('${waza}')">${waza}</button>`;
            });
        } else {
            title.innerText = "【攻者】攻撃技を選択してください";
            currentSetup.attacks.forEach(waza => {
                btnContainer.innerHTML += `<button onclick="fight('${waza}')">${waza}</button>`;
            });
        }
    }
    else if (currentPhase === 3) {
        title.innerText = "攻守を交代して次のターンへ進みます";
        btnContainer.innerHTML = `<button onclick="switchTurn()">攻守交代して次へ</button>`;
    }
}

// --- 構え選択ロジック（細分化版） ---

// パターンA：プレイヤーが守者のとき、自分で構えを選ぶ（CPUの攻者構えは自動決定）
function selectKamaeDefender(chosenKamae) {
    defenderKamae = chosenKamae;

    let availableAttackerOptions = [];
    if (defenderKamae === "八相構え") {
        availableAttackerOptions = ["一字構え"];
    } else if (defenderKamae === "前手高く") {
        availableAttackerOptions = ["中段構え"];
    } else {
        availableAttackerOptions = ["中段構え", "一字構え"];
    }
    const randomIdx = Math.floor(Math.random() * availableAttackerOptions.length);
    attackerKamae = availableAttackerOptions[randomIdx];

    currentPhase = 2; 
    updateUI(`お互いの構えが決定しました！\n攻者(CPU): [${attackerKamae}] ── 守者(あなた): [${defenderKamae}]\n\nあなたの防技を選んでください。`);
}

// パターンB-1：プレイヤーが攻者のとき、まずCPU（守者）が自動で構えを決定する
function cpuSelectKamaeDefender() {
    const randomDefIdx = Math.floor(Math.random() * defenderOptions.length);
    defenderKamae = defenderOptions[randomDefIdx];

    currentPhase = 1.5; // プレイヤー（攻者）の構え選択フェーズへ
    
    let msg = `相手（守者）は [${defenderKamae}] を選択しました。\n`;
    if (defenderKamae === "八相構え") msg += "（ルールにより、あなたは「一字構え」しか選べません）";
    else if (defenderKamae === "前手高く") msg += "（ルールにより、あなたは「中段構え」しか選べません）";
    else msg += "（あなたは「中段構え」か「一字構え」を選択できます）";

    updateUI(msg);
}

// パターンB-2：プレイヤーが攻者のとき、自分で構えを選ぶ
function selectKamaeAttacker(chosenKamae) {
    attackerKamae = chosenKamae;

    currentPhase = 2; // 技選択フェーズへ
    updateUI(`お互いの構えが決定しました！\n攻者(あなた): [${attackerKamae}] ── 守者(CPU): [${defenderKamae}]\n\nあなたの攻撃技を選んでください。`);
}

// --- 攻防の決着ロジック ---
function fight(playerWaza) {
    const battleKey = `${attackerKamae}_${defenderKamae}`;
    const currentSetup = battleDatabase[battleKey];

    let finalAtkWaza = "";
    let finalDefWaza = "";

    if (playerRole === "defender") {
        finalDefWaza = playerWaza;
        const randomIdx = Math.floor(Math.random() * currentSetup.attacks.length);
        finalAtkWaza = currentSetup.attacks[randomIdx];
    } else {
        finalAtkWaza = playerWaza;
        const randomIdx = Math.floor(Math.random() * currentSetup.defends.length);
        finalDefWaza = currentSetup.defends[randomIdx];
    }

    const isSuccess = currentSetup.checkSuccess(finalAtkWaza, finalDefWaza);
    
    let resultLog = `【攻防結果】\n`;
    resultLog += `攻者の技: 【${finalAtkWaza}】\n守者の技: 【${finalDefWaza}】\n\n`;

    if (isSuccess) {
        resultLog += `➔ 防御及び反撃成功！\n攻者（${playerRole === "attacker" ? "あなた" : "CPU"}）に 20 ダメージ！`;
        if (playerRole === "attacker") p_hp -= 20;
        else c_hp -= 20;
    } else {
        resultLog += `➔ 防御失敗！攻撃ヒット！\n守者（${playerRole === "defender" ? "あなた" : "CPU"}）に 20 ダメージ！`;
        if (playerRole === "defender") p_hp -= 20;
        else c_hp -= 20;
    }

    if (p_hp < 0) p_hp = 0;
    if (c_hp < 0) c_hp = 0;

    currentPhase = 3; 
    updateUI(resultLog);
}

function switchTurn() {
    playerRole = (playerRole === "defender") ? "attacker" : "defender";
    
    defenderKamae = "";
    attackerKamae = "";
    currentPhase = 1;

    const nextMsg = (playerRole === "defender") 
        ? "あなたの守者（防御）ターンです。構えを選んでください。"
        : "あなたの攻者（攻撃）ターンです。相手に構えを選ばせてください。";

    updateUI(nextMsg);
}

function resetGame() {
    p_hp = 100;
    c_hp = 100;
    playerRole = "defender";
    defenderKamae = "";
    attackerKamae = "";
    currentPhase = 1;
    updateUI("ゲーム開始！守者の構えを選んでください。");
}

document.addEventListener("DOMContentLoaded", () => {
    updateUI("ゲーム開始！あなたの守者（防御）ターンです。構えを選んでください。");
});