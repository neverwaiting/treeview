import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Person')
export class Person extends Component {
    children: Person[] = []
    parent: Person = null
    layer: number = 0
    index: number = 0

    x: number = 0
    y: number = 0

    // 初始横坐标
    ox: number = 0

    protected onLoad(): void {
    }

    setParent(parent: Person) {
        if (!parent) return
        this.parent = parent
        this.layer = parent.layer + 1
        parent.children.push(this)
    }

    updateNodePos() {
        this.node.setPosition(this.x, this.y)
    }
}
