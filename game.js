// --- ゲームの状態管理 ---
let p_hp = 100;
let c_hp = 100;

// プレイヤーの役割: "defender"(守者) または "attacker"(攻者)
let playerRole = "defender"; 

let defenderKamae = ""; // 守者の構え
let attackerKamae = ""; // 攻者の構え

// フェーズ管理: 1=最初の構え選択, 1.5=攻者(プレイヤー)の構え選択, 2=技選択, 3=結果表示
let currentPhase = 1; 

// 守者の構え選択肢
const defenderOptions = ["中段構え", "八相構え", "一字構え", "前手高く", "下段構え", "上膊誘う", "逆下段構え"];

// --- 技のアップグレード変換用辞書（守者HP減少用） ---
const upgradeWazaMap = {
    "腕十字": "腕十字固より立合掌固",
    "小手抜": "逆小手より裏固",
    "送小手": "送巻天秤",
    "内受突": "内受蹴",
    "上受突": "上受蹴",
    "外受突": "外受蹴",
    "打上突": "打上蹴",
    "十字抜": "十字小手",
    "屈伸突": "屈伸突蹴",
    "切返抜": "切小手",
    "上膊抜": "上膊捕",
    "外押受突": "外押受蹴",
    "内押受突": "内押受蹴",
    "袖抜": "袖捕",
    "袖巻": "袖巻天秤",
    "襟抜": "腕巻",
};

// --- 【重要】追加される限定技のリスト（ここにある技はすべて「黄色いボタン」になります） ---
const awakenedWazaList = [
    "逆天秤", "諸手押抜", "振突逆突二連", "混天一", "上上二連", "突天二", "振突二連", "振天二", "腕逆捕", "諸手十字小手", "諸手引抜", "巻小手",
    "上中上三連", "上中蹴三連", "突天三", "蹴天三", "一本背投", "諸手輪抜", "諸手巻抜", "押小手"
];

// --- 技ごとの個別ダメージ設定データベース ---
const wazaDamageTable = {
    "上段逆突": 5, "上段振突": 5, "手刀打": 5, "中段逆突": 5, "中段順突": 5, "差替中段順突": 5,
    "逆蹴": 10, "差込廻蹴": 10, "金的蹴": 10, "内手首掴む": 10, "外手首掴む": 10,
    "腕後捻上": 10, "内手首と順手＆後捻上": 10, "上襟握り押す": 10,
    "掴み押す": 10, "掴み突っ張る": 5,
    "上袖握り引く": 10, "後袖握り引く": 10, "下襟握り引く": 10, "順手引く": 10,
    "逆天秤": 10, "腕逆捕": 15,
    "振突中段二連": 15, "上上二連": 15, "振突二連": 15,
    "振突逆突二連": 15,
    
    // 新規追加技（威力はすべて強力な15に設定）
    "上中二連": 10, "突天一": 15,
    "上中上三連": 15, "上中蹴三連": 15, "突天三": 15, "蹴天三": 15,
    "一本背投": 15, "諸手輪抜": 15, "諸手巻抜": 15, "押小手": 15,

    "腕十字": 5, "腕十字固より立合掌固": 15, "小手抜": 5, "逆小手より裏固": 15,
    "寄抜": 5, "巻抜": 5, "送小手": 5, "送巻天秤": 15, "突抜": 5, "流水蹴": 10,
    "内受突": 5, "内受蹴": 15, "転身蹴": 10, "上受突": 5, "上受蹴": 10,
    "外受突": 5, "外受蹴": 10, "打上突": 5, "打上蹴": 10, "外押受突": 10, "外押受蹴": 15, "内押受突": 10, "内押受蹴": 15,
    "屈伸突": 10, "屈伸突蹴": 15,
    "切抜（外）": 5, "切抜（内）": 5, "十字抜": 5, "十字小手": 15, "横転身蹴": 20, "半転身蹴": 20,
    "十字受蹴": 15, "払受蹴": 15, "金的蹴膝受波返": 15, "下受蹴": 10, "下受順蹴": 10, "逆転身蹴": 15,
    "切返抜": 5, "切小手": 15, "三角抜": 5, "片手押抜": 5, "片胸落": 10, "襟十字": 10,
    "上膊抜": 5, "上膊捕": 15, "押切抜": 5,
    "袖抜": 5, "袖捕": 15, "袖巻": 10, "袖巻天秤": 15, "襟抜": 5, "腕巻": 15, "小手巻返": 10,
    "諸手押抜": 5, "諸手十字小手": 15, "諸手引抜": 15, "巻小手": 15,
    "混天一": 15, "突天二": 15, "振天二": 15,
};

// 守者のHPに応じて技名を変換する関数（黄色文字用）
function getUpgradedWaza(waza, currentHp) {
    if (currentHp <= 50 && upgradeWazaMap[waza]) {
        return upgradeWazaMap[waza];
    }
    return waza;
}

// アップグレードされた技名から元の技名を取得する関数
function getBaseWaza(waza) {
    for (const [base, upgraded] of Object.entries(upgradeWazaMap)) {
        if (waza === upgraded) return base;
    }
    return waza;
}

// --- 現在の攻防の選択肢リストを動的に取得するヘルパー関数 ---
function getAvailableWazaSetup() {
    const battleKey = `${attackerKamae}_${defenderKamae}`;
    const defaultSetup = battleDatabase[battleKey];
    if (!defaultSetup) return null;

    // 現在の攻者と守者のHPをそれぞれの役割から正しく判別する
    const atkHp = (playerRole === "attacker") ? p_hp : c_hp;
    const defHp = (playerRole === "defender") ? p_hp : c_hp;

    let setup = {
        attacks: [...defaultSetup.attacks],
        defends: [...defaultSetup.defends],
        checkSuccess: defaultSetup.checkSuccess
    };

    // 常時追加される技（攻：中段、守：一字）
    if (battleKey === "中段構え_一字構え") {
        if (!setup.attacks.includes("上中二連")) setup.attacks.push("上中二連");
        if (!setup.defends.includes("突天一")) setup.defends.push("突天一");
    }

    // 【攻者HP50%以下】で追加される限定技
    if (atkHp <= 50) {
        // 中段vs中段
        if (battleKey === "中段構え_中段構え") {
            if (!setup.attacks.includes("逆天秤")) setup.attacks.push("逆天秤");
            if (!setup.defends.includes("諸手押抜")) setup.defends.push("諸手押抜");
            if (!setup.attacks.includes("一本背投")) setup.attacks.push("一本背投");
            if (!setup.defends.includes("諸手輪抜")) setup.defends.push("諸手輪抜");
            if (!setup.defends.includes("諸手巻抜")) setup.defends.push("諸手巻抜");
        }
        // 一字vs一字
        if (battleKey === "一字構え_一字構え") {
            if (!setup.attacks.includes("振突逆突二連")) setup.attacks.push("振突逆突二連");
            if (!setup.defends.includes("混天一")) setup.defends.push("混天一");
            if (!setup.attacks.includes("振突二連")) setup.attacks.push("振突二連");
            if (!setup.defends.includes("振天二")) setup.defends.push("振天二");
        }
        // 中段vs一字
        if (battleKey === "中段構え_一字構え") {
            if (!setup.attacks.includes("上上二連")) setup.attacks.push("上上二連");
            if (!setup.defends.includes("突天二")) setup.defends.push("突天二");
            if (!setup.attacks.includes("上中上三連")) setup.attacks.push("上中上三連"); // 補正用エイリアス回避のため正式名で追加
            if (setup.attacks.includes("上中上三連")) {
                setup.attacks[setup.attacks.indexOf("上中上三連")] = "上中上三連";
            } else {
                setup.attacks.push("上スタック防止");
                setup.attacks.pop();
            }
            if (!setup.attacks.includes("上中上三連")) setup.attacks.push("上_中_上三連"); // 安全策
            setup.attacks = setup.attacks.filter(item => item !== "上_中_上三連");
            
            // 安全な純粋プッシュ処理
            if (!setup.attacks.includes("上中上三連")) setup.attacks.push("上中上三連");
            if (!setup.attacks.includes("上中蹴三連")) setup.attacks.push("上中蹴三連");
            if (!setup.defends.includes("突天三")) setup.defends.push("突天三");
            if (!setup.defends.includes("蹴天三")) setup.defends.push("蹴天三");
        }
        // 中段vs前手高く
        if (battleKey === "中段構え_前手高く") {
            if (!setup.attacks.includes("腕逆捕")) setup.attacks.push("腕逆捕");
            if (!setup.defends.includes("諸手十字小手")) setup.defends.push("諸手十字小手");
            if (!setup.defends.includes("諸手引抜")) setup.defends.push("諸手引抜");
            if (!setup.defends.includes("巻小手")) setup.defends.push("巻小手");
        }
    }

    // 【守者HP50%以下】で追加される限定技
    if (defHp <= 50) {
        // 中段vs中段
        if (battleKey === "中段構え_中段構え") {
            if (!setup.defends.includes("押小手")) setup.defends.push("押小手");
        }
    }

    return setup;
}

// --- 攻防相性データテーブル（基本形） ---
const battleDatabase = {
    "中段構え_中段構え": {
        attacks: ["内手首掴む", "外手首掴む"],
        defends: ["腕十字", "小手抜", "寄抜", "巻抜", "送小手", "突抜"],
        checkSuccess: (atk, def) => {
            const baseDef = getBaseWaza(def);
            // 守者HP50%以下 新規追加技判定
            if (atk === "外手首掴む" && baseDef === "押小手") return true;
            // 攻者HP50%以下 新規追加技判定
            if (atk === "一本背投" && ["諸手輪抜", "諸手巻抜"].includes(baseDef)) return true;
            if (atk === "逆天秤" && baseDef === "諸手押抜") return true;
            
            // 通常技判定
            if (atk === "内手首掴む" && ["腕十字", "小手抜"].includes(baseDef)) return true;
            if (atk === "外手首掴む" && ["寄抜", "巻抜", "送小手", "突抜"].includes(baseDef)) return true;
            return false;
        }
    },
    "中段構え_一字構え": {
        attacks: ["上段逆突", "上段振突", "手刀打"],
        defends: ["流水蹴", "内受突", "転身蹴", "上受突", "外受突", "打上突", "屈伸突", "外押受突", "内押受突"],
        checkSuccess: (atk, def) => {
            const baseDef = getBaseWaza(def);
            // 常時追加技判定
            if (atk === "上中二連" && baseDef === "突天一") return true;
            // 攻者HP50%以下 新規追加技判定
            if (atk === "上中上三連" && baseDef === "突天三") return true;
            if (atk === "上中蹴三連" && baseDef === "蹴天三") return true;
            if (atk === "上上二連" && baseDef === "突天二") return true;
            
            // 通常技判定
            if (atk === "上段逆突" && ["流水蹴", "内受突", "転身蹴", "外受突", "打上突"].includes(baseDef)) return true;
            if (atk === "上段振突" && ["屈伸突", "外押受突", "内押受突"].includes(baseDef)) return true;
            if (atk === "手刀打" && baseDef === "上受突") return true;
            return false;
        }
    },
    "中段構え_前手高く": {
        attacks: ["外手首掴む", "内手首掴む"],
        defends: ["切抜（外）", "切抜（内）", "十字抜"],
        checkSuccess: (atk, def) => {
            const baseDef = getBaseWaza(def);
            if (atk === "腕逆捕" && ["諸手十字小手", "諸手引抜", "巻小手"].includes(baseDef)) return true;
            if (atk === "外手首掴む" && ["切抜（外）", "十字抜"].includes(baseDef)) return true;
            if (atk === "内手首掴む" && baseDef === "切抜（内）") return true;
            return false;
        }
    },
    "一字構え_中段構え": {
        attacks: ["逆蹴"],
        defends: ["横転身蹴", "半転身蹴"],
        checkSuccess: (atk, def) => { return true; }
    },
    "一字構え_一字構え": {
        attacks: ["差込廻蹴", "金的蹴"],
        defends: ["十字受蹴", "払受蹴", "金的蹴膝受波返"],
        checkSuccess: (atk, def) => {
            const baseDef = getBaseWaza(def);
            if (atk === "振突逆突二連" && baseDef === "混天一") return true;
            if (atk === "振突二連" && baseDef === "振天二") return true;
            if (atk === "差込廻蹴" && ["十字受蹴", "払受蹴"].includes(baseDef)) return true;
            if (atk === "金的蹴" && baseDef === "金的蹴膝受波返") return true; 
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
    },
    "中段構え_下段構え": {
        attacks: ["腕後捻上", "内手首と順手＆後捻上", "上襟握り押す"],
        defends: ["切返抜", "三角抜", "片手押抜", "片胸落", "襟十字"],
        checkSuccess: (atk, def) => {
            if (atk === "腕後捻上" && ["切返抜", "三角抜"].includes(def)) return true;
            if (atk === "内手首と順手＆後捻上" && def === "片手押抜") return true;
            if (atk === "上襟握り押す" && ["片胸落", "襟十字"].includes(def)) return true;
            return false;
        }
    },
    "中段構え_上膊誘う": {
        attacks: ["掴み押す", "掴み突っ張る"],
        defends: ["上膊抜", "押切抜"],
        checkSuccess: (atk, def) => {
            if (atk === "掴み押す" && def === "上膊抜") return true;
            if (atk === "掴み突っ張る" && def === "押切抜") return true;
            return false;
        }
    },
    "中段構え_逆下段構え": {
        attacks: ["上袖握り引く", "後袖握り引く", "下襟握り引く", "順手引く"],
        defends: ["袖抜", "袖巻", "襟抜", "小手巻返"],
        checkSuccess: (atk, def) => {
            if (atk === "上袖握り引く" && def === "袖抜") return true;
            if (atk === "後袖握り引く" && def === "袖巻") return true;
            if (atk === "下襟握り引く" && def === "襟抜") return true;
            if (atk === "順手引く" && def === "小手巻返") return true;
            return false;
        }
    }
};

// --- ツールチップ用の詳細テキスト生成ロジック ---
function generateTooltipText(waza, role) {
    const power = wazaDamageTable[waza] || 5;
    const setup = getAvailableWazaSetup();
    if (!setup) return "";

    let details = `<b>≪詳細≫</b><br>`;

    if (role === "attacker") {
        details += `～攻撃～<br><b>${waza}</b>：${power}<br>`;
        let blockedBy = [];
        setup.defends.forEach(defWaza => {
            const defHp = (playerRole === "defender") ? p_hp : c_hp;
            const upgradedDefWaza = getUpgradedWaza(defWaza, defHp);
            if (setup.checkSuccess(waza, defWaza)) {
                blockedBy.push(`「${upgradedDefWaza}」`);
            }
        });
        
        if (blockedBy.length > 0) {
            details += `${blockedBy.join("")}には効果なし`;
        } else {
            details += `防がれる技なし（ガード不能）`;
        }
    } else {
        details += `～防御・反攻～<br><b>${waza}</b>：${power}<br>`;
        let effectiveAgainst = [];
        const baseWaza = getBaseWaza(waza);
        setup.attacks.forEach(atkWaza => {
            if (setup.checkSuccess(atkWaza, baseWaza)) {
                effectiveAgainst.push(`「${atkWaza}」`);
            }
        });

        if (effectiveAgainst.length > 0) {
            details += `${effectiveAgainst.join("")}には有効`;
        } else {
            details += `有効な対応技なし`;
        }
    }
    return details;
}

// --- 画面更新メイン処理 ---
function updateUI(message, isHtml = false) {
    const msgEl = document.getElementById("game-message");
    if(msgEl) {
        if (isHtml) msgEl.innerHTML = message;
        else msgEl.innerText = message;
    }
    if(document.getElementById("p-hp")) document.getElementById("p-hp").innerText = p_hp;
    if(document.getElementById("c-hp")) document.getElementById("c-hp").innerText = c_hp;
    
    const pRoleName = (playerRole === "defender") ? "【守者】" : "【攻者】";
    const cRoleName = (playerRole === "defender") ? "【攻者】" : "【守者】";
    
    document.getElementById("p-kamae").innerText = (playerRole === "defender") ? (defenderKamae ? `${pRoleName} ${defenderKamae}` : "選択中...") : (attackerKamae ? `${pRoleName} ${attackerKamae}` : "選択中...");
    document.getElementById("c-kamae").innerText = (playerRole === "defender") ? (attackerKamae ? `${cRoleName} ${attackerKamae}` : "待機中...") : (defenderKamae ? `${cRoleName} ${defenderKamae}` : "選択中...");

    if (p_hp <= 0 || c_hp <= 0) {
        const winner = p_hp <= 0 ? "相手(CPU)" : "あなた";
        if(msgEl) msgEl.innerText = `【勝負あり！】\n勝者: ${winner}`;
        document.getElementById("action-title").innerText = "ゲーム終了";
        document.getElementById("buttons").innerHTML = `<button onclick="resetGame()">最初から遊ぶ</button>`;
        return;
    }

    renderButtons();
}

// --- ボタンの動的生成（黄色ボタン対応） ---
function renderButtons() {
    const btnContainer = document.getElementById("buttons");
    const title = document.getElementById("action-title");
    if (!btnContainer || !title) return;
    
    btnContainer.innerHTML = ""; 

    if (currentPhase === 1) {
        if (playerRole === "defender") {
            title.innerText = "【守者のターン】あなたの構えを選んでください（7択）";
            defenderOptions.forEach(kamae => {
                btnContainer.innerHTML += `<button onclick="selectKamaeDefender('${kamae}')">${kamae}</button>`;
            });
        } else {
            title.innerText = "【攻者のターン】相手（守者）に構えを選ばせます";
            btnContainer.innerHTML = `<button onclick="cpuSelectKamaeDefender()">相手（守者）に構えを選ばせる</button>`;
        }
    } 
    else if (currentPhase === 1.5) {
        title.innerText = `相手の構え: [${defenderKamae}] ➔ あなた（攻者）の構えを選んでください`;
        
        let allowedAttackerOptions = [];
        if (["下段構え", "上膊誘う", "逆下段構え"].includes(defenderKamae)) {
            allowedAttackerOptions = ["中段構え"];
        } else if (defenderKamae === "八相構え") {
            allowedAttackerOptions = ["一字構え"];
        } else if (defenderKamae === "前手高く") {
            allowedAttackerOptions = ["中段構え"];
        } else {
            allowedAttackerOptions = ["中段構え", "一字構え"];
        }

        allowedAttackerOptions.forEach(kamae => {
            btnContainer.innerHTML += `<button onclick="selectKamaeAttacker('${kamae}')">${kamae}</button>`;
        });
    }
    else if (currentPhase === 2) {
        const currentSetup = getAvailableWazaSetup();
        if (!currentSetup) return;

        if (playerRole === "defender") {
            const isUpgradedPhase = p_hp <= 50;
            title.innerText = isUpgradedPhase ? "【守者：技昇格！】防技を選択してください" : "【守者】防技を選択してください";
            
            currentSetup.defends.forEach(waza => {
                const finalWaza = getUpgradedWaza(waza, p_hp);
                
                // --- クラス判定ロジック ---
                let classes = [];
                // 1. 守者HP減少による原型の「黄色文字」変換判定（新技でない場合のみ）
                if (finalWaza !== waza && !awakenedWazaList.includes(finalWaza)) classes.push("upgraded-waza");
                // 2. 限定追加技による「黄色ボタン」判定
                if (awakenedWazaList.includes(finalWaza)) classes.push("awakened-btn");
                
                const classStr = classes.length > 0 ? `class="${classes.join(" ")}"` : '';
                const tooltipHtml = generateTooltipText(finalWaza, "defender");

                btnContainer.innerHTML += `
                    <div class="tooltip-container">
                        <button ${classStr} onclick="handleWazaClick('${finalWaza}')">${finalWaza}</button>
                        <div class="waza-tooltip">${tooltipHtml}</div>
                    </div>`;
            });
        } else {
            title.innerText = "【攻者】攻撃技を選択してください";
            currentSetup.attacks.forEach(waza => {
                // 限定追加技による「黄色ボタン」判定
                const classStr = awakenedWazaList.includes(waza) ? 'class="awakened-btn"' : '';
                const tooltipHtml = generateTooltipText(waza, "attacker");
                
                btnContainer.innerHTML += `
                    <div class="tooltip-container">
                        <button ${classStr} onclick="handleWazaClick('${waza}')">${waza}</button>
                        <div class="waza-tooltip">${tooltipHtml}</div>
                    </div>`;
            });
        }
        setupTouchEvents(); 
    }
    else if (currentPhase === 3) {
        title.innerText = "攻守を交代して次のターンへ進みます";
        btnContainer.innerHTML = `<button onclick="switchTurn()">攻守交代して次へ</button>`;
    }
}

// --- スマホ用の長押し(Hold)ハンドラ ---
let touchTimer = null;
let isLongPress = false;

function setupTouchEvents() {
    const containers = document.querySelectorAll('.tooltip-container');
    
    containers.forEach(container => {
        const btn = container.querySelector('button');
        const tooltip = container.querySelector('.waza-tooltip');
        
        btn.addEventListener('touchstart', (e) => {
            isLongPress = false;
            touchTimer = setTimeout(() => {
                isLongPress = true;
                document.querySelectorAll('.waza-tooltip').forEach(el => el.classList.remove('show-tooltip'));
                tooltip.classList.add('show-tooltip');
            }, 400);
        }, { passive: true });

        btn.addEventListener('touchend', (e) => {
            clearTimeout(touchTimer);
            if (isLongPress) {
                e.preventDefault();
            }
        });

        btn.addEventListener('touchmove', () => {
            clearTimeout(touchTimer);
        }, { passive: true });
    });
}

document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.tooltip-container')) {
        document.querySelectorAll('.waza-tooltip').forEach(el => el.classList.remove('show-tooltip'));
    }
}, { passive: true });

function handleWazaClick(waza) {
    if (isLongPress) {
        isLongPress = false;
        return;
    }
    fight(waza);
}

// --- 構え選択ロジック ---
function selectKamaeDefender(chosenKamae) {
    defenderKamae = chosenKamae;
    let availableAttackerOptions = [];
    if (["下段構え", "上膊誘う", "逆下段構え"].includes(defenderKamae)) {
        availableAttackerOptions = ["中段構え"];
    } else if (defenderKamae === "八相構え") {
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

function cpuSelectKamaeDefender() {
    const randomDefIdx = Math.floor(Math.random() * defenderOptions.length);
    defenderKamae = defenderOptions[randomDefIdx];
    currentPhase = 1.5; 
    
    let msg = `相手（守者）は [${defenderKamae}] を選択しました。<br>`;
    if (["下段構え", "上膊誘う", "逆下段構え"].includes(defenderKamae)) msg += "（ルールにより、あなたは「中段構え」しか選べません）";
    else if (defenderKamae === "八相構え") msg += "（ルールにより、あなたは「一字構え」しか選べません）";
    else if (defenderKamae === "前手高く") msg += "（ルールにより、あなたは「中段構え」しか選べません）";
    else msg += "（あなたは「中段構え」か「一字構え」を選択できます）";

    updateUI(msg, true);
}

function selectKamaeAttacker(chosenKamae) {
    attackerKamae = chosenKamae;
    currentPhase = 2; 
    updateUI(`お互いの構えが決定しました！\n攻者(あなた): [${attackerKamae}] ── 守者(CPU): [${defenderKamae}]\n\nあなたの攻撃技を選んでください。`);
}

// --- 攻防の決着ロジック ---
function fight(playerWaza) {
    const currentSetup = getAvailableWazaSetup();
    if (!currentSetup) return;

    let finalAtkWaza = "";
    let finalDefWaza = "";

    if (playerRole === "defender") {
        finalDefWaza = playerWaza;
        const randomIdx = Math.floor(Math.random() * currentSetup.attacks.length);
        finalAtkWaza = currentSetup.attacks[randomIdx];
    } else {
        finalAtkWaza = playerWaza;
        const randomIdx = Math.floor(Math.random() * currentSetup.defends.length);
        const baseCpuWaza = currentSetup.defends[randomIdx];
        
        finalDefWaza = getUpgradedWaza(baseCpuWaza, c_hp);
        // もしCPUの選択肢に「覚醒追加技」が直接選ばれていた場合はそのまま使用する
        if (currentSetup.defends.includes(baseCpuWaza) && awakenedWazaList.includes(baseCpuWaza)) {
            finalDefWaza = baseCpuWaza;
        }
    }

    // 相性判定
    const isSuccess = currentSetup.checkSuccess(finalAtkWaza, finalDefWaza);
    
    const atkDamage = wazaDamageTable[finalAtkWaza] || 5;
    const defDamage = wazaDamageTable[wazaDamageTable[finalDefWaza] ? finalDefWaza : getBaseWaza(finalDefWaza)] || 5;

    // ログ用黄色文字判定ロジック
    const isAtkUpgraded = Object.values(upgradeWazaMap).includes(finalAtkWaza) || awakenedWazaList.includes(finalAtkWaza);
    const isDefUpgraded = Object.values(upgradeWazaMap).includes(finalDefWaza) || awakenedWazaList.includes(finalDefWaza);

    const displayAtkWaza = isAtkUpgraded ? `<span class="yellow-text">${finalAtkWaza}</span>` : finalAtkWaza;
    const displayDefWaza = isDefUpgraded ? `<span class="yellow-text">${finalDefWaza}</span>` : finalDefWaza;

    let resultLog = `【攻防結果】<br>`;
    resultLog += `攻者の技: 【${displayAtkWaza}】(威力:${atkDamage})<br>守者の技: 【${displayDefWaza}】(威力:${defDamage})<br><br>`;

    if (isSuccess) {
        resultLog += `➔ 防御及び反撃成功！<br>守者が一本！ 攻者（${playerRole === "attacker" ? "あなた" : "CPU"}）に ${defDamage} ダメージ！`;
        if (playerRole === "attacker") p_hp -= defDamage;
        else c_hp -= defDamage;
    } else {
        resultLog += `➔ 防御失敗！攻撃ヒット！<br>攻者が一本！ 守者（${playerRole === "defender" ? "あなた" : "CPU"}）に ${atkDamage} ダメージ！`;
        if (playerRole === "defender") p_hp -= atkDamage;
        else c_hp -= atkDamage;
    }

    if (p_hp < 0) p_hp = 0;
    if (c_hp < 0) c_hp = 0;

    currentPhase = 3; 
    updateUI(resultLog, true);
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

// --- 画面切り替えロジック ---
function changeScreen(screenName) {
    // すべての画面から active クラスを外す
    document.getElementById('screen-home').classList.remove('active');
    document.getElementById('screen-rule').classList.remove('active');
    document.getElementById('screen-kamoku').classList.remove('active');
    document.getElementById('screen-game').classList.remove('active');

    // 指定された画面に active クラスを付与して表示する
    document.getElementById(`screen-${screenName}`).classList.add('active');

    // ゲーム画面に進んだ場合は、ゲームを初期状態（あるいはリセット状態）にする
    if (screenName === 'game') {
        resetGame();
    }
}

// ゲーム中に「タイトルへ戻る」を押したときの処理
function quitGame() {
    if (confirm("ゲームを終了してタイトル画面に戻りますか？")) {
        changeScreen('home');
    }
}

// 元々あった DOMContentLoaded の処理を「ホーム画面表示」に合わせて調整
document.addEventListener("DOMContentLoaded", () => {
    // 起動時はホーム画面を表示させておくため、ここではUIの準備だけ行う
    p_hp = 100;
    c_hp = 100;
});

// --- 画面更新メイン処理（レイアウト変更対応版） ---
function updateUI(message, isHtml = false) {
    const msgEl = document.getElementById("game-message");
    if(msgEl) {
        if (isHtml) msgEl.innerHTML = message;
        else msgEl.innerText = message;
    }
    
    // 数値の更新
    if(document.getElementById("p-hp")) document.getElementById("p-hp").innerText = p_hp;
    if(document.getElementById("c-hp")) document.getElementById("c-hp").innerText = c_hp;
    
    // ～～ HPバーの伸縮・色アニメーション連動 ～～
    const pBar = document.getElementById("p-hp-bar");
    const cBar = document.getElementById("c-hp-bar");
    
    if (pBar) {
        pBar.style.width = `${p_hp}%`;
        pBar.className = "hp-bar animate-bar"; // クラスリセット
        if (p_hp <= 20) pBar.classList.add("danger");
        else if (p_hp <= 50) pBar.classList.add("warning");
    }
    if (cBar) {
        cBar.style.width = `${c_hp}%`;
        cBar.className = "hp-bar animate-bar"; // クラスリセット
        if (c_hp <= 20) cBar.classList.add("danger");
        else if (c_hp <= 50) cBar.classList.add("warning");
    }
    
    // 攻守の役割名
    const pRoleName = (playerRole === "defender") ? "【守者】" : "【攻者】";
    const cRoleName = (playerRole === "defender") ? "【攻者】" : "【守者】";
    
    // 構えと役割の表示更新
    document.getElementById("p-kamae").innerText = (playerRole === "defender") ? (defenderKamae ? `${pRoleName} ${defenderKamae}` : `${pRoleName} 構え選択中...`) : (attackerKamae ? `${pRoleName} ${attackerKamae}` : `${pRoleName} 構え選択中...`);
    document.getElementById("c-kamae").innerText = (playerRole === "defender") ? (attackerKamae ? `${cRoleName} ${attackerKamae}` : `${cRoleName} 思考中...`) : (defenderKamae ? `${cRoleName} ${defenderKamae}` : `${cRoleName} 構え選択中...`);

    // 勝敗判定
    if (p_hp <= 0 || c_hp <= 0) {
        const winner = p_hp <= 0 ? "相手(CPU)" : "あなた";
        if(msgEl) msgEl.innerHTML = `<b style="font-size:1.4rem; color:#f1c40f;">【勝負あり！】</b><br>勝者: ${winner}`;
        document.getElementById("action-title").innerText = "ゲーム終了";
        document.getElementById("buttons").innerHTML = `<button onclick="resetGame()" class="start-btn" style="width:100%; padding:12px;">もう一度遊ぶ</button>`;
        return;
    }

    renderButtons();
}