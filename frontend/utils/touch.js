function _getIndex(e) {
  return e.currentTarget.dataset.index;
}

function _getMoveX(e, startX) {
  return getClientX(e) - startX;
}

function _getEndX(e, startX) {
  var touch = e.changedTouches;
  if (touch.length === 1) {
    return touch[0].clientX - startX;
  }
}

function _resetData(dataList) {
  for(var i in dataList) {
    dataList[i].left = 0;
  }
  return dataList;
}

function getClientX(e) {
  var touch = e.touches;
  if(touch.length === 1) {
    return touch[0].clientX;
  }
}

function touchM(e, dataList, startX) {
  var list = _resetData(dataList);
  list[_getIndex(e)].left = _getMoveX(e, startX);
  return list;
}

function touchE(e, dataList, startX, width) {
  var list = _resetData(dataList);
  var disX = _getEndX(e, startX);
  var left = 0;

  if(disX < 0) {
    Math.abs(disX) > width / 4 ? left = -width : left = 0
  }
  else {
    left = 0;
  }

  list[_getIndex(e)].left = left;
  return list;
}

module.exports = {
  getClientX: getClientX,
  touchM: touchM,
  touchE: touchE
}