import { _decorator, Component, EventTouch, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FamilyViewUI')
export class FamilyViewUI extends Component {
    @property(Node)
    family: Node = null

    protected onLoad(): void {
        console.log("=>")
        this.node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
            const delta = event.getUIDelta()
            const pos = this.family.position
            this.family.setPosition(pos.x + delta.x, pos.y + delta.y)
        }, this)
    }
}
