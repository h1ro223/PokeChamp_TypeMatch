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

    let selectedAtk = []; // ["炎", "格闘"] などの最大2つの配列
    let selectedDef = [];

    let bookmarks = JSON.parse(localStorage.getItem('pokemon-bookmarks')) || [];

    const atkGrid = document.getElementById('grid-atk');
    const defGrid = document.getElementById('grid-def');
    const atkDisplay = document.getElementById('display-atk');
    const defDisplay = document.getElementById('display-def');
    const resultDisplay = document.getElementById('result-display');
    const btnBookmark = document.getElementById('btn-bookmark');

    // UI初期化：18タイプのボタンを生成
    const initGrid = () => {
        TYPES.forEach(type => {
            // 攻撃側ボタン
            const atkBtn = document.createElement('button');
            atkBtn.className = 'type-btn';
            atkBtn.innerHTML = `<img src="./Type/${type}.png" alt="${type}" onerror="this.style.display='none'"><span>${type}</span>`;
            atkBtn.dataset.type = type;
            atkBtn.addEventListener('click', () => handleTypeClick(type, 'atk'));
            atkGrid.appendChild(atkBtn);

            // 防御側ボタン
            const defBtn = document.createElement('button');
            defBtn.className = 'type-btn';
            defBtn.innerHTML = `<img src="./Type/${type}.png" alt="${type}" onerror="this.style.display='none'"><span>${type}</span>`;
            defBtn.dataset.type = type;
            defBtn.addEventListener('click', () => handleTypeClick(type, 'def'));
            defGrid.appendChild(defBtn);
        });
    };

    // タイプボタンクリック時の処理
    const handleTypeClick = (type, side) => {
        let currentArray = side === 'atk' ? selectedAtk : selectedDef;
        
        const index = currentArray.indexOf(type);
        if (index > -1) {
            // 既に選択されている場合は解除
            currentArray.splice(index, 1);
        } else {
            // 新規追加。最大2つまで。2つなら一番古いのを消す
            if (currentArray.length >= 2) {
                currentArray.shift(); // 先頭を削除
            }
            currentArray.push(type);
        }

        updateUI();
    };

    // リセット機能
    document.getElementById('reset-atk').addEventListener('click', () => { selectedAtk = []; updateUI(); });
    document.getElementById('reset-def').addEventListener('click', () => { selectedDef = []; updateUI(); });
    document.getElementById('reset-all').addEventListener('click', () => { selectedAtk = []; selectedDef = []; updateUI(); });

    // UIの更新（ボタンのハイライト、選択状態の表示、結果計算）
    const updateUI = () => {
        // ボタンのアクティブ状態の更新
        Array.from(atkGrid.children).forEach(btn => {
            if (selectedAtk.includes(btn.dataset.type)) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        Array.from(defGrid.children).forEach(btn => {
            if (selectedDef.includes(btn.dataset.type)) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // 選択されたタイプの表示エリア更新
        renderDisplay(atkDisplay, selectedAtk);
        renderDisplay(defDisplay, selectedDef);

        // 相性の計算
        calculateEffectiveness();
    };

    const renderDisplay = (displayEl, arr) => {
        if (arr.length === 0) {
            displayEl.innerHTML = '<span class="placeholder-text">未選択</span>';
            return;
        }
        displayEl.innerHTML = arr.map(type => 
            `<div class="selected-item"><img src="./Type/${type}.png" onerror="this.style.display='none'">${type}</div>`
        ).join('');
    };

    const calculateEffectiveness = () => {
        if (selectedAtk.length === 0 || selectedDef.length === 0) {
            resultDisplay.innerHTML = '<span class="placeholder-text">タイプを選択してください</span>';
            resultDisplay.className = 'result-display';
            btnBookmark.disabled = true;
            return;
        }

        btnBookmark.disabled = false;

        const atk1Idx = TYPES.indexOf(selectedAtk[0]);
        const atk2Idx = selectedAtk.length > 1 ? TYPES.indexOf(selectedAtk[1]) : -1;
        const def1Idx = TYPES.indexOf(selectedDef[0]);
        const def2Idx = selectedDef.length > 1 ? TYPES.indexOf(selectedDef[1]) : -1;

        // atk1の倍率計算
        let mult1 = TYPE_CHART[atk1Idx][def1Idx];
        if (def2Idx !== -1) mult1 *= TYPE_CHART[atk1Idx][def2Idx];

        // atk2の倍率計算 (存在する場合のみ乗算)
        let totalMult = mult1;
        if (atk2Idx !== -1) {
            let mult2 = TYPE_CHART[atk2Idx][def1Idx];
            if (def2Idx !== -1) mult2 *= TYPE_CHART[atk2Idx][def2Idx];
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
    };

    // ----- ブックマーク機能 -----
    const renderBookmarks = () => {
        const listEl = document.getElementById('bookmark-list');
        if (bookmarks.length === 0) {
            listEl.innerHTML = '<p class="placeholder-text" style="font-size:0.9rem;">ブックマークはありません。</p>';
            return;
        }

        listEl.innerHTML = '';
        bookmarks.forEach((bm, idx) => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';

            const atkHtml = bm.atk.map(t => `<span class="bm-part"><img src="./Type/${t}.png" class="bm-icon" onerror="this.style.display='none'"> ${t}</span>`).join('');
            const defHtml = bm.def.map(t => `<span class="bm-part"><img src="./Type/${t}.png" class="bm-icon" onerror="this.style.display='none'"> ${t}</span>`).join('');

            item.innerHTML = `
                <div class="bookmark-info" title="クリックでこの対面を読み込む">
                    <div style="display:flex; gap:0.5rem; align-items:center;">[攻撃] ${atkHtml}</div>
                    <span class="bm-vs">VS</span>
                    <div style="display:flex; gap:0.5rem; align-items:center;">[防御] ${defHtml}</div>
                </div>
                <button class="btn-delete-bm" data-idx="${idx}">削除</button>
            `;

            // クリックで復元
            item.querySelector('.bookmark-info').addEventListener('click', () => {
                selectedAtk = [...bm.atk];
                selectedDef = [...bm.def];
                updateUI();
                window.scrollTo({ top: 0, behavior: 'smooth' }); // 上に戻る
            });

            // 削除ボタン
            item.querySelector('.btn-delete-bm').addEventListener('click', (e) => {
                e.stopPropagation();
                bookmarks.splice(idx, 1);
                saveBookmarks();
            });

            listEl.appendChild(item);
        });
    };

    const saveBookmarks = () => {
        localStorage.setItem('pokemon-bookmarks', JSON.stringify(bookmarks));
        renderBookmarks();
    };

    btnBookmark.addEventListener('click', () => {
        // 重複チェック
        const isDuplicate = bookmarks.some(bm => 
            JSON.stringify(bm.atk) === JSON.stringify(selectedAtk) && 
            JSON.stringify(bm.def) === JSON.stringify(selectedDef)
        );
        if (isDuplicate) {
            alert('すでにブックマークされています。');
            return;
        }

        bookmarks.push({ atk: [...selectedAtk], def: [...selectedDef] });
        saveBookmarks();
    });

    // 初期化処理
    initGrid();
    updateUI();
    renderBookmarks();

    // 仮フォーム
    document.getElementById('registration-form').addEventListener('submit', (e) => {
        e.preventDefault();
        console.log("ポケモン登録リクエストを受け付けました（仮実装）");
        alert("登録情報を受け付けました！（詳細はコンソールをご覧ください）");
    });
});
