document.addEventListener('DOMContentLoaded', () => {
    const TYPES = [
        "ノーマル", "ほのお", "みず", "でんき", "くさ", "こおり", "かくとう", "どく",
        "じめん", "ひこう", "エスパー", "むし", "いわ", "ゴースト", "ドラゴン", "あく",
        "はがね", "フェアリー"
    ];

    // 相性表 (行:攻撃側, 列:防御側)
    const TYPE_CHART = [
        /* ノ */ [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5, 1],
        /* 炎 */ [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2, 1],
        /* 水 */ [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1, 1],
        /* 電 */ [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1, 1],
        /* 草 */ [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1, 0.5, 1],
        /* 氷 */ [1, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 0.5, 1],
        /* 闘 */ [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 2, 1, 2, 0.5],
        /* 毒 */ [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0, 2],
        /* 地 */ [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2, 1],
        /* 飛 */ [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5, 1],
        /* 超 */ [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5, 1],
        /* 虫 */ [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5, 0.5],
        /* 岩 */ [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5, 1],
        /* 霊 */ [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 1],
        /* 竜 */ [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5, 0],
        /* 悪 */ [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 0.5],
        /* 鋼 */ [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 2],
        /* 妖 */ [1, 0.5, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 2, 2, 0.5, 1]
    ];

    // ひらがな・カタカナ変換用
    const hiraToKata = (str) => {
        return str.replace(/[\u3041-\u3096]/g, match => {
            return String.fromCharCode(match.charCodeAt(0) + 0x60);
        });
    };

    // 入力・サジェスト設定
    const setupAutocomplete = (inputId, listId, iconId) => {
        const input = document.getElementById(inputId);
        const list = document.getElementById(listId);
        const icon = document.getElementById(iconId);

        // リスト描画
        const renderList = (filterText = '') => {
            list.innerHTML = '';
            const normalizedFilter = hiraToKata(filterText);
            
            const filtered = TYPES.filter(type => {
                // 部分一致で検索（前方一致でもOKだが、使いやすさ重視で部分一致）
                return hiraToKata(type).includes(normalizedFilter);
            });

            if (filtered.length > 0) {
                filtered.forEach(type => {
                    const li = document.createElement('li');
                    li.innerHTML = `<img src="./${type}.png" alt="${type}" onerror="this.style.display='none'"> <span>${type}</span>`;
                    li.addEventListener('mousedown', () => {
                        input.value = type;
                        icon.src = `./${type}.png`;
                        icon.style.display = 'block';
                        list.style.display = 'none';
                        calculateEffectiveness();
                    });
                    list.appendChild(li);
                });
                list.style.display = 'block';
            } else {
                list.style.display = 'none';
            }
        };

        // イベントリスナー
        input.addEventListener('focus', () => renderList(input.value));
        input.addEventListener('input', (e) => {
            renderList(e.target.value);
            // 入力が不正になったらアイコン非表示
            if (!TYPES.includes(e.target.value)) {
                icon.style.display = 'none';
            } else {
                icon.src = `./${e.target.value}.png`;
                icon.style.display = 'block';
            }
            calculateEffectiveness();
        });
        input.addEventListener('blur', () => {
            // クリックイベントが発火するように少し遅らせる
            setTimeout(() => { list.style.display = 'none'; }, 150);
            
            // 完全一致しない場合はクリア
            if (!TYPES.includes(input.value) && input.value !== "") {
                input.value = "";
                icon.style.display = 'none';
                calculateEffectiveness();
            }
        });
    };

    setupAutocomplete('atk1', 'atk1-list', 'atk1-icon');
    setupAutocomplete('atk2', 'atk2-list', 'atk2-icon');
    setupAutocomplete('def1', 'def1-list', 'def1-icon');
    setupAutocomplete('def2', 'def2-list', 'def2-icon');

    // 相性計算ロジック
    const calculateEffectiveness = () => {
        const atk1Str = document.getElementById('atk1').value;
        const atk2Str = document.getElementById('atk2').value;
        const def1Str = document.getElementById('def1').value;
        const def2Str = document.getElementById('def2').value;

        const resultDisplay = document.getElementById('result-display');

        // 最低限 atk1 と def1 が必要
        if (!TYPES.includes(atk1Str) || !TYPES.includes(def1Str)) {
            resultDisplay.innerHTML = '<span class="placeholder-text">タイプを選択してください</span>';
            resultDisplay.className = 'result-display';
            return;
        }

        const atk1Idx = TYPES.indexOf(atk1Str);
        const atk2Idx = TYPES.includes(atk2Str) ? TYPES.indexOf(atk2Str) : -1;
        const def1Idx = TYPES.indexOf(def1Str);
        const def2Idx = TYPES.includes(def2Str) ? TYPES.indexOf(def2Str) : -1;

        // タイプ重複の場合は無視（例: 炎・炎 -> 炎）
        const realDef2Idx = (def1Idx === def2Idx) ? -1 : def2Idx;
        const realAtk2Idx = (atk1Idx === atk2Idx) ? -1 : atk2Idx;

        // atk1の倍率計算
        let mult1 = TYPE_CHART[atk1Idx][def1Idx];
        if (realDef2Idx !== -1) mult1 *= TYPE_CHART[atk1Idx][realDef2Idx];

        // atk2の倍率計算 (存在する場合のみ乗算)
        let totalMult = mult1;
        if (realAtk2Idx !== -1) {
            let mult2 = TYPE_CHART[realAtk2Idx][def1Idx];
            if (realDef2Idx !== -1) mult2 *= TYPE_CHART[realAtk2Idx][realDef2Idx];
            totalMult *= mult2;
        }

        // 表示テキスト決定
        let text = "";
        let colorClass = "";

        if (totalMult === 0) {
            text = "✕ 効果なし(x0)";
            colorClass = "res-immune";
        } else if (totalMult === 0.25) {
            text = "▢ 効果 かなりいまひとつ(x0.25)";
            colorClass = "res-notvery";
        } else if (totalMult === 0.5) {
            text = "△ 効果 いまひとつ(x0.5)";
            colorClass = "res-notvery";
        } else if (totalMult === 1.0) {
            text = "♪ 等倍(x1.0)";
            colorClass = "res-normal";
        } else if (totalMult === 2.0) {
            text = "〇 効果 ばつぐん(x2.0)";
            colorClass = "res-super";
        } else if (totalMult >= 4.0) {
            text = `☆ 効果 超ばつぐん(x${totalMult.toFixed(1)})`;
            colorClass = "res-super";
        }

        resultDisplay.innerText = text;
        resultDisplay.className = `result-display ${colorClass}`;
        
        // 軽いアニメーション効果
        resultDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => {
            resultDisplay.style.transform = 'scale(1)';
        }, 150);
    };

    // フォーム仮実装のイベント
    document.getElementById('registration-form').addEventListener('submit', (e) => {
        e.preventDefault();
        console.log("ポケモン登録リクエストを受け付けました（仮実装）");
        alert("登録情報を受け付けました！（詳細はコンソールをご覧ください）");
    });
});
