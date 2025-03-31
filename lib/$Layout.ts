import { $ContainerOptions, $Container, $StateArgument, $Element, $ContainerEventMap } from "elexis";

export interface $LayoutOptions extends $ContainerOptions {}
export class $Layout<EM extends $LayoutEventMap = $LayoutEventMap> extends $Container<HTMLElement, EM> {
    protected _property = {
        ROW_MAX_HEIGHT: 200,
        GAP: 0,
        IS_RENDERING: false,
        RENDER_REQUEST: false,
        COLUNM: 1,
        TYPE: 'justified' as $LayoutType,
        ROOT: null as null | $Container,
        ITEM_PROPERTIES: new Map<$Element, $LayoutItemProperties>()
    }
    constructor(options?: $ContainerOptions) {
        super('layout', options);
        this.style({display: 'block', position: 'relative'})
        new ResizeObserver((records) => {
            if (!this.inDOM()) return;
            this.render();
            this.dom.dispatchEvent(new Event('resize'));
        }).observe(this.dom);
        document.addEventListener('scroll', (e) => {if (e.target === this.root().dom) this.scrollCompute()}, {passive: true})
        new IntersectionObserver((entries) => {
            if (!this.inDOM()) return;
            this.render();
        }).observe(this.dom)
    }

    /**
     * The layout view type.
     */
    type(): $LayoutType
    type(type: $LayoutType): this
    type(type?: $LayoutType) { return $.fluent(this, arguments, () => this._property.TYPE, () => $.set(this._property, 'TYPE', type)) }

    /**
     * The maximum height of justified layout row.
     */
    maxHeight(): number;
    maxHeight(height: $StateArgument<number> | undefined): this
    maxHeight(height?: $StateArgument<number> | undefined) { return $.fluent(this, arguments, () => this._property.ROW_MAX_HEIGHT, () => $.set(this._property, 'ROW_MAX_HEIGHT', height))}

    /**
     * The column amount of waterfall layout row.
     */
    column(): number;
    column(column: $StateArgument<number> | undefined): this
    column(column?: $StateArgument<number> | undefined) { return $.fluent(this, arguments, () => this._property.COLUNM, () => $.set(this._property, 'COLUNM', column))}

    gap(): number;
    gap(gap: $StateArgument<number> | undefined): this;
    gap(gap?: $StateArgument<number> | undefined) { return $.fluent(this, arguments, () => this._property.GAP, ()=> $.set(this._property, 'GAP', gap,))}

    /**
     * The srcollable parent element. Default to the document `body` element.
     */
    root(): $Container
    root(root: $Container): this
    root(root?: $Container) { return $.fluent(this, arguments, () => this._property.ROOT ?? $(document), () => $.set(this._property, 'ROOT', root)) }

    protected get COL_WIDTH() { return (this.offsetWidth - this._property.GAP * (this._property.COLUNM - 1)) / (this._property.COLUNM); }

    protected justifiedCompute() {
        const ROW_LIST: Row[] = [];
        const LAYOUT_WIDTH = this.offsetWidth;
        type Row = {items: Item[], ratio: number, height: number};
        type Item = {$node: $Element, ratio: number};
        for (const child of this.children.array) {
            const $child = $(child) as $Element;
            if ($child instanceof $Element === false) continue;
            const ratio_attr = $child.attribute('layout-item-ratio');
            const CHILD_RATIO: number = ratio_attr ? parseFloat(ratio_attr) : $child.dom.offsetWidth / $child.dom.offsetHeight;
            const CHILD_ITEM: Item = {$node: $child, ratio: CHILD_RATIO};
            let LAST_ROW = ROW_LIST.at(-1);
            if (!LAST_ROW || LAST_ROW.height < this._property.ROW_MAX_HEIGHT) { LAST_ROW = {height: 0, items: [], ratio: 0}; ROW_LIST.push(LAST_ROW)}
            let ITEMS_RATIO = 0;
            LAST_ROW.items.forEach(item => ITEMS_RATIO += item.ratio);
            const ROW_RATIO_WITH_CHILD = ITEMS_RATIO + CHILD_RATIO;
            const ROW_HEIGHT_WITH_CHILD = (LAYOUT_WIDTH - this._property.GAP * LAST_ROW.items.length) / ROW_RATIO_WITH_CHILD;
            LAST_ROW.items.push(CHILD_ITEM); LAST_ROW.ratio = ROW_RATIO_WITH_CHILD; LAST_ROW.height = ROW_HEIGHT_WITH_CHILD;
        }
        return ROW_LIST;
    }

    protected waterfallCompute() {
        const COLUMN_LIST: Column[] = [];
        type Column = {items: Item[], ratio: number, height: number};
        type Item = {$node: $Element, ratio: number};
        const COL_WIDTH = this.COL_WIDTH;
        const SHORTEST_COL = () => { 
            if (COLUMN_LIST.length < this._property.COLUNM) { const col: Column = {items: [], ratio: 0, height: 0}; COLUMN_LIST.push(col); return col; }
            return [...COLUMN_LIST].sort((a, b) => a.height - b.height)[0];
        }
        for (const child of this.children.array) {
            const $child = $(child) as $Element;
            if ($child instanceof $Element === false) continue;
            const ratio_attr = $child.attribute('layout-item-ratio');
            const CHILD_RATIO: number = ratio_attr ? parseFloat(ratio_attr) : $child.dom.offsetWidth / $child.dom.offsetHeight;
            const CHILD_ITEM: Item = {$node: $child, ratio: CHILD_RATIO};
            const COL = SHORTEST_COL();
            let ITEMS_RATIO = 0;
            COL.items.forEach(item => ITEMS_RATIO += item.ratio);
            const COL_RATIO_WITH_CHILD = COL_WIDTH / (COL.height + COL_WIDTH / CHILD_RATIO);
            const COL_HEIGHT_WITH_CHILD = COL_WIDTH / COL_RATIO_WITH_CHILD;
            COL.items.push(CHILD_ITEM); COL.ratio = COL_RATIO_WITH_CHILD; COL.height = COL_HEIGHT_WITH_CHILD;
        }
        return COLUMN_LIST;
    }

    render() {
        if (!this.inDOM()) return this;
        this.events.fire('beforeRender');
        this._property.ITEM_PROPERTIES.clear();
        if (this._property.TYPE === 'justified') {
            const ROW_LIST = this.justifiedCompute();
            let ROW_POSITION_Y = 0;
            for (const ROW of ROW_LIST) {
                let ITEM_POSITION_X = 0;
                if (ROW.height > this._property.ROW_MAX_HEIGHT) ROW.height = this._property.ROW_MAX_HEIGHT;
                for (const item of ROW.items) {
                    const ITEM_WIDTH = item.ratio * ROW.height;
                    item.$node.style({
                        position: 'absolute',
                        height: `${ROW.height}px`,
                        width: `${ITEM_WIDTH}px`,
                        top: `${ROW_POSITION_Y}px`,
                        left: `${ITEM_POSITION_X}px`,
                    })
                    item.$node.attribute('layout-item-ratio', item.ratio);
                    this._property.ITEM_PROPERTIES.set(item.$node, {height: ROW.height, width: ITEM_WIDTH, top: ROW_POSITION_Y, left: ITEM_POSITION_X, ratio: item.ratio, $node: item.$node})
                    item.$node.coordinate({x: ITEM_POSITION_X, y: ROW_POSITION_Y, height: ROW.height, width: ITEM_WIDTH})
                    ITEM_POSITION_X += (ROW.height * item.ratio) + this._property.GAP;
                }
                ROW_POSITION_Y += ROW.height + this._property.GAP;
            }
            this.style({height: `${ROW_POSITION_Y}px`})
        }

        else if (this._property.TYPE = 'waterfall') {
            const COL_LIST = this.waterfallCompute();
            const COL_WIDTH = this.COL_WIDTH;
            let COL_POSITION_X = 0;
            for (const COL of COL_LIST) {
                let ITEM_POSITION_Y = 0;
                for (const item of COL.items) {
                    const ITEM_HEIGHT = COL_WIDTH / item.ratio;
                    item.$node.style({
                        position: 'absolute',
                        height: `${ITEM_HEIGHT}px`,
                        width: `${COL_WIDTH}px`,
                        top: `${ITEM_POSITION_Y}px`,
                        left: `${COL_POSITION_X}px`
                    })
                    item.$node.attribute('layout-item-ratio', item.ratio);
                    this._property.ITEM_PROPERTIES.set(item.$node, {height: ITEM_HEIGHT, width: COL_WIDTH, top: ITEM_POSITION_Y, left: COL_POSITION_X, ratio: item.ratio, $node: item.$node})
                    item.$node.coordinate({x: COL_POSITION_X, y: ITEM_POSITION_Y, height: ITEM_HEIGHT, width: COL_WIDTH})
                    ITEM_POSITION_Y += ITEM_HEIGHT + this._property.GAP;
                }
                COL_POSITION_X += COL_WIDTH + this._property.GAP;
            }
            if (COL_LIST.length) {
                const heightestCOL = COL_LIST.sort((a, b) => b.height - a.height)[0];
                this.style({height: `${heightestCOL.height + heightestCOL.items.length * this._property.GAP}px`});
            } else {
                this.style({height: ''})
            }
        }
        this.scrollCompute();
        this.events.fire('afterRender');
        return this;
    }

    protected scrollCompute() {
        if (this.inDOM() === false) return;
        const scrollTopForLayout = document.documentElement.scrollTop - this.dom.offsetTop
        this._property.ITEM_PROPERTIES.forEach((properties, $node) => {
            const itemTop = properties.top
            const itemBottom = properties.top + properties.height;
            if ($node.attribute('focus') === '' || document.activeElement === $node.dom) return; // skip focus dom
            if (itemBottom > scrollTopForLayout && itemTop < scrollTopForLayout + innerHeight + properties.height) $node.hide(false, false);
            else $node.hide(true, false);
        })
        this.children.render();
    }
}

export type $LayoutType = 'justified' | 'waterfall';
export type $LayoutItemProperties = {height: number, width: number, top: number, left: number, ratio: number, $node: $Element};

export interface $LayoutEventMap extends $ContainerEventMap {
    beforeRender: [];
    afterRender: [];
}