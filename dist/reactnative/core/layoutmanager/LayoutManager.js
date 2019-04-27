"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var CustomError_1 = require("../exceptions/CustomError");
var LayoutManager = /** @class */ (function () {
    function LayoutManager() {
    }
    LayoutManager.prototype.getOffsetForIndex = function (index) {
        var layouts = this.getLayouts();
        if (layouts.length > index) {
            return { x: layouts[index].x, y: layouts[index].y };
        }
        else {
            throw new CustomError_1.default({
                message: "No layout available for index: " + index,
                type: "LayoutUnavailableException",
            });
        }
    };
    //You can ovveride this incase you want to override style in some cases e.g, say you want to enfore width but not height
    LayoutManager.prototype.getStyleOverridesForIndex = function (index) {
        return undefined;
    };
    return LayoutManager;
}());
exports.LayoutManager = LayoutManager;
var WrapGridLayoutManager = /** @class */ (function (_super) {
    __extends(WrapGridLayoutManager, _super);
    function WrapGridLayoutManager(layoutProvider, renderWindowSize, isHorizontal, cachedLayouts) {
        if (isHorizontal === void 0) { isHorizontal = false; }
        var _this = _super.call(this) || this;
        _this._layoutProvider = layoutProvider;
        _this._window = renderWindowSize;
        _this._totalHeight = 0;
        _this._totalWidth = 0;
        _this._isHorizontal = !!isHorizontal;
        _this._layouts = cachedLayouts ? cachedLayouts : [];
        _this._columnCount = 2;
        return _this;
    }
    WrapGridLayoutManager.prototype.getContentDimension = function () {
        return { height: this._totalHeight, width: this._totalWidth };
    };
    WrapGridLayoutManager.prototype.getLayouts = function () {
        return this._layouts;
    };
    WrapGridLayoutManager.prototype.getOffsetForIndex = function (index) {
        if (this._layouts.length > index) {
            return { x: this._layouts[index].x, y: this._layouts[index].y };
        }
        else {
            throw new CustomError_1.default({
                message: "No layout available for index: " + index,
                type: "LayoutUnavailableException",
            });
        }
    };
    WrapGridLayoutManager.prototype.overrideLayout = function (index, dim) {
        var layout = this._layouts[index];
        if (layout) {
            layout.isOverridden = true;
            layout.width = dim.width;
            layout.height = dim.height;
        }
        return true;
    };
    WrapGridLayoutManager.prototype.setMaxBounds = function (itemDim) {
        if (this._isHorizontal) {
            itemDim.height = Math.min(this._window.height, itemDim.height);
        }
        else {
            itemDim.width = Math.min(this._window.width, itemDim.width);
        }
    };
    //TODO:Talha laziliy calculate in future revisions
    WrapGridLayoutManager.prototype.relayoutFromIndex = function (startIndex, itemCount) {
        // startIndex = this._locateFirstNeighbourIndex(startIndex);
        //TODO find a way to use start index
        startIndex = 0;
        var startX = 0;
        var startY = 0;
        var itemDim = { height: 0, width: 0 };
        var newLayouts = [];
        var columnLenghts = [];
        for (var idx = 0; idx < this._columnCount; idx++) {
            columnLenghts[idx] = 0;
        }
        var minColumnIdxFn = function (cols) { return cols.reduce(function (acc, val, idx, arr) { return (val < arr[acc] ? idx : acc); }, 0); };
        var colLenght = (this._isHorizontal ? this._window.height : this._window.width) / this._columnCount;
        for (var i = startIndex; i < itemCount; i++) {
            var oldLayout = this._layouts[i];
            if (oldLayout && oldLayout.isOverridden) {
                itemDim.height = oldLayout.height;
                itemDim.width = oldLayout.width;
            }
            else {
                this._layoutProvider.setComputedLayout(this._layoutProvider.getLayoutTypeForIndex(i), itemDim, i);
            }
            this.setMaxBounds(itemDim);
            var minColumnIdx = minColumnIdxFn(columnLenghts);
            startY = columnLenghts[minColumnIdx];
            startX = colLenght * minColumnIdx;
            // newLayouts.push({ x: startX, y: startY, height: itemDim.height, width: itemDim.width });
            newLayouts.push({
                x: startX,
                y: startY,
                height: itemDim.height,
                width: itemDim.width,
            });
            if (this._isHorizontal) {
                columnLenghts[minColumnIdx] += itemDim.width;
                if (startY + colLenght <= this._window.height) {
                    startY = startY + colLenght;
                }
                else {
                    startY = 0;
                }
                startX = columnLenghts[minColumnIdxFn(columnLenghts)];
            }
            else {
                columnLenghts[minColumnIdx] += itemDim.height;
            }
        }
        this._layouts = newLayouts;
        var maxColumnIdxFn = function () { return columnLenghts.reduce(function (acc, val, idx, arr) { return (arr[acc] > val ? acc : idx); }, 0); };
        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth = columnLenghts[maxColumnIdxFn()];
        }
        else {
            this._totalWidth = this._window.width;
            this._totalHeight = columnLenghts[maxColumnIdxFn()];
        }
    };
    WrapGridLayoutManager.prototype._pointDimensionsToRect = function (itemRect) {
        if (this._isHorizontal) {
            this._totalWidth = itemRect.x;
        }
        else {
            this._totalHeight = itemRect.y;
        }
    };
    WrapGridLayoutManager.prototype._setFinalDimensions = function (maxBound) {
        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth += maxBound;
        }
        else {
            this._totalWidth = this._window.width;
            this._totalHeight += maxBound;
        }
    };
    WrapGridLayoutManager.prototype._locateFirstNeighbourIndex = function (startIndex) {
        if (startIndex === 0) {
            return 0;
        }
        var i = startIndex - 1;
        for (; i >= 0; i--) {
            if (this._isHorizontal) {
                if (this._layouts[i].y === 0) {
                    break;
                }
            }
            else if (this._layouts[i].x === 0) {
                break;
            }
        }
        return i;
    };
    WrapGridLayoutManager.prototype._checkBounds = function (itemX, itemY, itemDim, isHorizontal) {
        return isHorizontal ? (itemY + itemDim.height <= this._window.height) : (itemX + itemDim.width <= this._window.width);
    };
    return WrapGridLayoutManager;
}(LayoutManager));
exports.WrapGridLayoutManager = WrapGridLayoutManager;
//# sourceMappingURL=LayoutManager.js.map