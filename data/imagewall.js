/**
 * 图片墙
 * 
 * @param imgs 图片的src 数组
 * @param container 放置图片的容器
 * @param containerWidth 容器的宽度
 * @param rowHeight 行的高度
 */
function imagewall(imgs, container, containerWidth, rowHeight) {
	calcImageSizes(imgs).done(function(sizes) {
		var newSizes = resizeTo(sizes, rowHeight);
		var rows = toRows(newSizes, containerWidth);

		calcFinalSize(newSizes, rows, containerWidth, rowHeight);
		var $imgContainer = renderRows(imgs, newSizes, rows);
		$imgContainer.appendTo(container);
	});
}

/**
 * 获取图片的原始大小
 * 
 * @param imgs 图片的src 数组
 * @returns 图片的原始大小数组
 */
function calcImageSizes(imgs) {
	var sizes = [];
	var deferred = $.Deferred();
	var resolveCount = 0;

	function calc(index) {
		var imgObj = new Image();
		imgObj.src = imgs[index];

		// var deferred = $.Deferred();
		$(imgObj).on("load", function() {
			sizes[index] = {
				width : imgObj.width,
				height : imgObj.height
			}
			resolveCount++;
			if (resolveCount == imgs.length) {
				deferred.resolve(sizes);
			}
		});
	}

	for ( var index = 0; index < imgs.length; index++) {
		calc(index);
	}
	return deferred;
}

/**
 * 根据指定的高度, 对图片进行缩放
 * 
 * @param sizes 图片原始大小数组
 * @param height 指定的高度
 * @returns {Array} 图片缩放后的大小数组
 */
function resizeTo(sizes, height) {
	var newSizes = [];
	$.each(sizes, function(index, size) {
		// 宽度 = (指定高度 / 图片高度) * 图片宽度
		var rate = size.width / size.height;
		newSizes[index] = {
			width : height * rate,
			height : height
		}
	});
	return newSizes;
}

/**
 * 根据缩放后的大小, 将图片划分的多行
 * 
 * @param newSizes 缩放后的图片大小
 * @param containerWidth 容器的宽度
 * @returns {Array} 每一个元素是一行的开始和结束序号, 已经总的图片的宽度
 */
function toRows(newSizes, containerWidth) {
	var rows = [];

	var indexMark = 0;
	var rowWidth = 0;

	function addRow(start, end, width) {
		rows.push({
			start : start,
			end : end,
			width : width
		});
	}
	// 计算每一行的图片
	// 1. 将图片的宽度依次相加
	// 2. 如果当前一行的宽度加上当前这一个图片的宽度 小于 容器的宽度, 则继续相加
	// 3. 如果是等于, 则是刚刚好了, 不用管了
	// 4. 如果是大于, 则根据加上这一张图片后的宽度, 比不加上的宽度, 那一个和容器宽度比较接近.

	for ( var index = 0; index < newSizes.length; index++) {
		var w = rowWidth + newSizes[index].width;
		if (w < containerWidth) {
			// 如果当前一行的宽度加上当前这一个图片的宽度 小于 容器的宽度
			rowWidth = w;
		} else if (w == containerWidth) {
			// 重新开始一行了.
			addRow(indexMark, index, w);
			indexMark = index + 1;
			rowWidth = 0;
		} else { // w > containerWidth
			if (containerWidth - rowWidth <= w - containerWidth) {
				// 不加上这张图片比较适合
				// 这一张图片是下一行的了
				addRow(indexMark, index - 1, rowWidth);
				indexMark = index;
				rowWidth = newSizes[index].width;
			} else {
				// 这一张图片是当前行的
				addRow(indexMark, index, w);
				indexMark = index + 1;
				rowWidth = 0;
			}
		}
	}

	if (indexMark < newSizes.length) {
		addRow(indexMark, newSizes.length - 1, rowWidth);
	}

	return rows;
}

/**
 * 根据分的行, 重新计算每一行的每一个图片的高度
 * 
 * @param newSizes 缩放后的图片大小, 重新计算后的大小会更新到这个数组
 * @param rows 每一行的开始/结束序号
 * @param containerWidth 容器的宽度
 * @param rowHeight 每一行默认的高度, 在这个高度上进行调整
 */
function calcFinalSize(newSizes, rows, containerWidth, rowHeight) {
	function calc(row, newHeight, dHeight) {
		for ( var index = row.start; index <= row.end; index++) {
			var size = newSizes[index];
			newSizes[index] = {
				width : size.width * dHeight,
				height : newHeight
			}
		}
	}

	$.each(rows, function(rowIndex, row) {
		var rowWidth = row.width;

		if (rowWidth != containerWidth) {
			var newHeight = containerWidth * rowHeight / rowWidth;
			
			var dHeight = newHeight / rowHeight;
			if (rowIndex == rows.length - 1 && dHeight > 1.5) {
				// 最后一行可能没那么多图片了, 则不放到最大, 只按照一定的比例就可以
				dHeight = 1.5;
				newHeight = dHeight * rowHeight;
			}
			
			calc(row, newHeight, dHeight);
		}
	});
}

/**
 * 生成行以及图片
 * 
 * @param imgs 图片src 数组
 * @param newSizes 每一个图片的大小
 * @param rows 每一行的开始/结束序号
 * @returns 生成的所有图片, 这里是一个jQuery 对象
 */
function renderRows(imgs, newSizes, rows) {
	var $container = $("<div></div>");
	$.each(rows, function(rowIndex, row) {
		var $row = $("<div style='overflow: hidden; white-space: nowrap;'></div>").appendTo($container);
		for ( var index = row.start; index <= row.end; index++) {
			var $img = $("<img/>").attr("src", imgs[index]).css(newSizes[index]);
			$img.css({
				"margin" : "3px",
			}).appendTo($row);
		}
	});
	return $container;
}