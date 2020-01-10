function Draggable(listSelector, onDropCallback) {
    enableDragList(document.querySelector(listSelector))

    function enableDragList(list) {
        if (!list || list.length == 0) return
        Array.prototype.map.call(list.children, (item) => {
            enableDragItem(item.querySelector(".dragzone"))
        });
    }

    function enableDragItem(item) {
        item.setAttribute('draggable', true)
        item.ondrag = handleDrag;
        item.ondragend = handleDrop;
    }

    function handleDrag(item) {
        const selectedItem = item.target.closest("li"),
            list = selectedItem.parentNode,
            x = event.clientX,
            y = event.clientY;

        selectedItem.classList.add('drag-sort-active');
        let swapItem = document.elementFromPoint(x, y) === null ? selectedItem : document.elementFromPoint(x, y);

        if (list === swapItem.parentNode) {
            swapItem = swapItem !== selectedItem.nextSibling ? swapItem : swapItem.nextSibling;
            list.insertBefore(selectedItem, swapItem);
        }
    }

    function handleDrop(item) {
        item.target.closest("li").classList.remove('drag-sort-active');
        onDropCallback()
    }

}
module.exports = Draggable;