
class GridCellEditor
{
    constructor(grid, parentEle)
    {
        this.grid = grid;
        this.parentEle = parentEle

        if(!this.parentEle) this.parentEle = this.grid.element.parentElement

        this.editing = null; // {row, col, cellEl, oldValue}
        this.editor = null;
    }

    enableGridEditor()
    {
        this._createEditorOnce();
        this._bindRepositionEvents();
    }

    _createEditorOnce()
    {
        //그리드에 키 이벤트 발생시키기 위해 
        const tabinx = this.grid.getAttr('tabindex')
        if(!tabinx) this.grid.setAttr('tabindex', 100)
        
        this.editor = document.createElement('input')
        this.editor.setAttribute('type', 'text')

        // hostView 위에 오버레이로 올립니다 
        this.parentEle.append(this.editor)

        // absolute 오버레이 스타일 

        this.editor.style.cssText = 'position:absolute; z-index:9999; box-sizing:border-box; display: none;';

        // DOM 이벤트로 처리
        this.editor.addEventListener('keydown', (e) => 
        {
            // 한글 IME 조합 중 Enter로 커밋되는 문제 방지
            if (e.isComposing || e.keyCode === 229) return;

            e.stopPropagation()

            if (e.key === 'Enter') 
            {
                e.preventDefault();
                this.commit();
            }

            else if (e.key === 'Escape') 
            {
                e.preventDefault();
                this.cancel();
            }

            // Tab / Shift+Tab 이동 편집
            else if (e.key === 'Tab') 
            {
                e.preventDefault();

                if(!this.moveAndEdit(0, e.shiftKey ? -1 : 1))
                {
                    const cnt = this.grid.getColumnCount() - 1
                    const curCell = this.grid.getSelectedCells()[0][0]
                    const pos = this.grid.getCellPos(curCell)

                    let newCell = null

                    if(e.shiftKey)
                    {
                        //좌상단 체크
                        if(pos[0]==0) return;

                        newCell = this.grid.getCell(pos[0]-1, cnt)
                        this._selectCellEl(newCell)
                    }
                    else
                    {
                        newCell = this.grid.getCell(pos[0]+1, 0)
                        //우하단 체크
                        if(!newCell) return;
                        this._selectCellEl(newCell)
                    }

                     this.beginEdit(null, null, newCell);
                }
                
            }
            else
            {
                // 화살표 이동 편집
                const el = this.editor;
                const valLen = (el.value ?? '').length;
                const s = el.selectionStart ?? 0;
                const t = el.selectionEnd ?? 0;

                if (e.key === 'ArrowLeft') {
                    // 커서가 맨 왼쪽일 때만 셀 이동
                    if (s === 0 && t === 0) {
                        e.preventDefault();
                        this.moveAndEdit(0, -1);
                    }
                }

                else if (e.key === 'ArrowRight') {
                    // 커서가 맨 오른쪽일 때만 셀 이동
                    if (s === valLen && t === valLen) {
                        e.preventDefault();
                        this.moveAndEdit(0, 1);
                    }
                }

                else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.moveAndEdit(-1, 0);
                }

                else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.moveAndEdit(1, 0);
                }
            }
        });

        this.editor.addEventListener('blur', () => {
            // 포커스 아웃 시 저장
            this.commit();
        });

        this.grid.element.addEventListener('keydown', (e) => 
        {
            let cells = this.grid.getSelectedCells(), curCell = null

            if(cells.length<1) return

            curCell = cells[0][0]
            
            if (e.key == 'Enter' || e.key=='F2')
            {
                e.preventDefault();
                    
                this.beginEdit(null, null, curCell);
            }
            else
            {
                if (e.key === 'ArrowLeft') 
                {
                    e.preventDefault();
                    this.moveAndSelect(curCell, 0, -1);
                }

                else if (e.key === 'ArrowRight') 
                {
                    e.preventDefault();
                    this.moveAndSelect(curCell, 0, 1);
                }

                else if (e.key === 'ArrowUp') 
                {
                    e.preventDefault();
                    this.moveAndSelect(curCell, -1, 0);
                }

                else if (e.key === 'ArrowDown') 
                {
                    e.preventDefault();
                    this.moveAndSelect(curCell, 1, 0);
                }                
            }

        })

        this.grid.element.addEventListener('dblclick', (e)=>
        {
            //셀 내부에 있는 button, input tag 를 터치한 경우는 셀렉트 되지 않도록
            if(e.target.tagName=='BUTTON' || e.target.tagName=='INPUT') 
            {
                return;
            }
            
            let selItem = null;
            let ePath = e.path || (e.composedPath && e.composedPath()), curItem;
            
            //터치한 element 중에서 셀 영역을 찾는다.
            for(let inx in ePath)
            {
                curItem = ePath[inx];
                
                //자신의 컴포넌트 영역이상으로 올라가지 않기위해
                if(curItem.acomp) break;
                
                if(curItem.tagName=='TD')
                {
                    selItem = curItem;
                    break;
                }
            }
            
            //셀이 아닌 영역을 터치한 경우
            if(selItem) 
                this.beginEdit(null, null, selItem);
        });
    }

    _bindRepositionEvents()
    {
        // grid가 스크롤 되는 구조라면 스크롤 이벤트를 잡아 위치 재계산
        // (grid 내부 스크롤 엘리먼트를 쓰는 경우 그 엘리먼트에 바인딩)
        const scrollTarget = this.grid.scrollArea;
        scrollTarget.addEventListener('scroll', () => {
            if (this.editing) this.reposition();
        }, true);

        window.addEventListener('resize', () => {
            if (this.editing) this.reposition();
        });
    }

    isEditable(row, col)
    {
        // 컬럼별 편집 가능 여부/잠금 등을 여기서 판단
        // 예: this.grid.getColumnInfo(col).editable === true
        return true;
    }

    getCellValue(row, col)
    {
        // AGrid API에 맞게 교체
        // 예: return this.grid.getCellText(row, col);
        return (this.editing?.cellEl?.textContent ?? '').trim();
    }

    setCellValue(row, col, value)
    {
        // AGrid API에 맞게 교체(데이터 모델 갱신 후 리프레시)
        // 예: this.grid.setCellText(row, col, value);
        if (this.editing?.cellEl) this.editing.cellEl.textContent = value;
    }

    validate(row, col, value)
    {
        // 숫자 컬럼 예시(컬럼 메타에 dataType 달아두고 분기)
        // if (this.grid.getColumnInfo(col).dataType === 'number') ...
        return true;
    }

    beginEdit(row, col, cellEl)
    {
        if (!this.isEditable(row, col)) return;

        // 이미 편집 중이면 먼저 커밋
        if (this.editing) this.commit();

        const oldValue = (cellEl?.textContent ?? '').trim();
        this.editing = { row, col, cellEl, oldValue };

        //this.editor.setText(oldValue);
        this.editor.value = oldValue;
        //this.editor.show();
        this.editor.style['display'] = ''

        this.reposition();
        this.editor.focus();
        // ATextField에 selectAll 같은 게 있으면 사용, 없으면 DOM으로
        setTimeout(() => {
            try { this.editor.select?.(); } catch(e) {}
        }, 0);
    }

    reposition()
    {
        if (!this.editing?.cellEl) return;

        const rect = this.editing.cellEl.getBoundingClientRect();

        // viewport 기준 rect를 hostView 기준 좌표로 변환
        const hostRect = this.parentEle.getBoundingClientRect();

        const left = rect.left - hostRect.left;
        const top  = rect.top  - hostRect.top;

        this.editor.style.left = left+'px'
        this.editor.style.top = top+'px';           

        this.editor.style.width = rect.width+'px'
        this.editor.style.height = rect.height+'px';
    }

    commit()
    {
        if (!this.editing) return true;

        const { row, col, oldValue } = this.editing;
        const newValue = (this.editor.value ?? '').trim();

        if (!this.validate(row, col, newValue)) {
            this.editor.focus();
            return false; // 검증 실패면 이동/종료 금지
        }

        if (newValue !== oldValue) {
            this.setCellValue(row, col, newValue);
        }

        this._end();
        return true; // 성공
    }

    cancel()
    {
        if (!this.editing) return;
        // 취소는 원값 유지
        this._end();
    }

    _end()
    {
        this.editor.style.display = 'none';
        this.editing = null;

        this.grid.setFocus()
    }

    _isEditableCellEl(cellEl)
    {
        // 지금은 beginEdit(null,null,cellEl)로도 잘 되니, 기본 true로 두고
        // 편집 불가 컬럼이 있으면 여기서 걸러도 됩니다.
        // 예: 첫 컬럼(ID)은 편집 불가 -> return cellEl.cellIndex !== 0;
        return !!cellEl;
    }

    _getNeighborCellEl(curCellEl, dRow, dCol)
    {
        if (!curCellEl) return null;

        // 좌/우 이동
        if (dRow === 0 && dCol !== 0) {
            let next = curCellEl;
            while (true) {
                next = (dCol > 0) ? next.nextElementSibling : next.previousElementSibling;
                if (!next) return null;
                if (this._isEditableCellEl(next)) return next;
            }
        }

        // 상/하 이동 (같은 컬럼 인덱스 유지)
        const rowEl = curCellEl.parentElement;
        if (!rowEl) return null;

        const colIndex = (curCellEl.cellIndex ?? Array.from(rowEl.children).indexOf(curCellEl));
        let nextRow = rowEl;

        while (true) {
            nextRow = (dRow > 0) ? nextRow.nextElementSibling : nextRow.previousElementSibling;
            if (!nextRow) return null;

            const candidate = nextRow.children?.[colIndex];
            if (candidate && this._isEditableCellEl(candidate)) return candidate;
        }
    }

    _selectCellEl(cellEl)
    {
        this.grid.selectCell([cellEl])
    }

    moveAndEdit(dRow, dCol)
    {
        if (!this.editing?.cellEl) return;

        const curCellEl = this.editing.cellEl;
        const nextCellEl = this._getNeighborCellEl(curCellEl, dRow, dCol);
        if (!nextCellEl) return false;

        // 먼저 커밋이 성공해야 이동
        if (!this.commit()) return false;

        this._selectCellEl(nextCellEl);
        this.beginEdit(null, null, nextCellEl);
        return true
    }

    moveAndSelect(curCellEl, dRow, dCol)
    {
        const nextCellEl = this._getNeighborCellEl(curCellEl, dRow, dCol);
        if (!nextCellEl) return false;

        this._selectCellEl(nextCellEl);
        return true
    }
}
