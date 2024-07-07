import { _decorator, assert, Component, Graphics, instantiate, Node, NodePool, Prefab, v2 } from 'cc';
import { Person } from './Person';
const { ccclass, property } = _decorator;

@ccclass('Family')
export class Family extends Component {
    @property(Node)
    personPrefab: Node = null

    root: Person = null
    hashTree: Array<Array<Person>> = []
    nodePool: NodePool = null

    // 根节点横坐标
    private rootX: number
    // 根节点纵坐标
    private rootY: number
    // 父子节点的垂直间距
    private yInterval: number = 60 + 90
    // 节点间的水平最小间距
    private nodeInterval: number = 40 + 80
    // 节点的宽度
    private nodeWidth: number = 80
    // 节点的高度
    private nodeHeight: number = 90

    private mainMembers: Array<Person> = []

    private graphics: Graphics = null

    protected onLoad(): void {
        this.graphics = this.node.getComponent(Graphics)
        this.initPool()
        this.test()
    }

    protected onDestroy(): void {
        this.nodePool.clear()
    }

    private initPool(size = 3000) {
        this.nodePool = new NodePool()
        for (let i = 0; i < size; ++i) {
            let newNode = null
            while (!newNode) {
                newNode = instantiate(this.personPrefab) 
            }
            this.nodePool.put(newNode)
        }
    }

    private getPersonNodeFromPool() {
        let newNode = this.nodePool.get()
        if (!newNode) {
            console.warn("池子里没有节点了")
            let newNode = null
            while (!newNode) {
                newNode = instantiate(this.personPrefab) 
            }
        }
        newNode.active = true
        return newNode
    }

    private test() {
        this.root = this.createChild(null)
        this.mainMembers.push(this.root)
        // this.updateLayout()
        
        let count = 200 - 1
        let parents = [this.root]
        while (count > 0) {
            let newParents = []
            for (const parent of parents) {
                const n = Math.floor(Math.random() * 2) + 1
                for (let i = 0; i < n; ++i) {
                    newParents.push(this.createChild(parent))
                    if (--count <= 0) break
                }
                if (count <= 0) break
            }
            parents = newParents
        }
        console.log('node count:', this.mainMembers.length)
        this.updateLayout()
        
        let startx = 320;
        let starty = 480;

        // 左侧终点坐标
        let leftendx = 120; 
        let leftendy = 480;

        // 右侧终点坐标 
        let rightendx = 520;
        let rightendy = 480;

        this.drawConnectLine(startx, starty, leftendx, leftendy)
        this.drawConnectLine(startx, starty, rightendx, rightendy)
    }

    debugTree() {
        for (let l = 0; l < this.hashTree.length; ++l) {
            const layer = this.hashTree[l]
            let count = 0
            for (let i = 0; i < layer.length; ++i) {
                count += layer[i].children.length
                console.assert(layer[i].layer == l && layer[i].index == i)
                if (layer[i].parent) {
                    const children = layer[i].parent.children
                    for (let j = 0; j < children.length; ++j) {
                        console.assert(children[j].layer == layer[i].parent.layer + 1)
                        console.assert(children[j].parent.layer == layer[i].parent.layer)
                        console.assert(children[j].parent.index == layer[i].parent.index)
                    }
                }
            }
            console.assert(l == this.hashTree.length - 1 || this.hashTree[l + 1].length == count)
        }
    }

    private showTree() {
        const showPerson = (p: Person) => {
            let str = '['
            p.children.forEach(child => {
                str += `(${child.layer}, ${child.index}, ${child.parent.layer == p.layer}, ${child.parent.index == p.index}), `
            })
            str += ']'
            return str
        }
        let i = 0
        for (const layer of this.hashTree) {
            console.log(`layer=${i} ==================>`)
            layer.forEach(p => {
                console.log(showPerson(p))
            })
            ++i
        }
    }

    private updateLayout() {
        this.layout()
        this.patch(this.root)
        this.graphics.clear()
        this.updateDrawLine(this.root)
    }

    private drawConnectLine(startx, starty, endx, endy) {
        this.graphics.moveTo(startx, starty)
        if (startx == endx) {
            this.graphics.lineTo(endx, endy)
        } else {
            const isLeft = endx < startx
            let startControlPointX = startx;
            let startControlPointY = starty - 70;
            let midControlPointX = isLeft ? startx - 0.4 * (startx - endx) : startx + 0.4 * (endx - startx);
            let midControlPointY = endy + 40
            let endControlPointX = endx
            let endControlPointY = endy - 10
            this.graphics.bezierCurveTo(
                // endx, starty,
                // startx, endy,
                // (startx + endx) / 2 + (isLeft ? 20 : -20), starty,
                // (startx + endx) / 2 - (isLeft ? 20 : -20), endy,
                // endx, endy
                startControlPointX, startControlPointY,
                midControlPointX, midControlPointY,
                endControlPointX, endControlPointY
            )
        }
        this.graphics.stroke()
    }

    private updateDrawLine(root: Person) {
        if (!root) return
        const h = this.nodeHeight / 2
        for (const child of root.children) {
            this.drawConnectLine(root.x, root.y - h, child.x, child.y + h)
            this.updateDrawLine(child)
        }
    }

    private addChildToLayerTree(child: Person) {
        if (child.layer == 0) {
            this.hashTree[0] = [child]
            return
        }

        let layer = this.hashTree[child.layer]
        if (!layer) {
            layer = []
            this.hashTree[child.layer] = layer
        }

        const parentLayerIdx = child.parent.layer
        const parentLayer = this.hashTree[parentLayerIdx]
        console.assert(parentLayerIdx == child.layer - 1)
        console.log(parentLayerIdx, child.layer)
        let count = 0
        for (let i = 0; i <= child.parent.index; ++i) {
            count += parentLayer[i].children.length
        }
        const index = count - 1
        if (index < 0 || index > layer.length || child == null) {
            console.error(`当前层共有节点数: ${index} / ${layer.length}`)
            console.error(`父节点所在层索引+下标索引: ${child.parent.layer} / ${child.parent.index}`)
            console.error(parentLayer)
            console.error(layer)
            console.error(this.hashTree)
            const a = null
            a.t
        }
        layer.push(null)
        for (let i = layer.length - 1; i > index; --i) {
            layer[i] = layer[i - 1]
            layer[i].index = i
        }
        child.index = index
        layer[index] = child

        console.assert(this.hashTree[child.layer][child.index] == child)
    }

    private createPerson() {
        let personNode = this.getPersonNodeFromPool()
        let person = personNode.getComponent(Person)
        person.updateNodePos()
        this.node.addChild(personNode)
        return person
    }

    private createChild(parent: Person) {
        let person = this.createPerson()
        if (parent) {
            person.setParent(parent)
            person.y = parent.y - this.yInterval
            person.updateNodePos()
        }

        console.assert(person != null || (parent != null && this.mainMembers.length > 0))
        this.addChildToLayerTree(person)
        return person
    }

    /**
     * 核心函数：布局调整函数
     */
    layout() {
        // 正推布局，从根节点开始，按照节点的水平垂直间距布局整棵树
        this.layoutChild(this.root)
        // 回推布局，从最底层开始，往上检索，查找重叠节点，调整优化树的布局
        this.layoutOverlaps()
    }

    /**
     * 找出与node1的某个祖先节点为兄弟节点的node2的祖先节点
     * @param node1 
     * @param node2 
     */
    findCommonParentNode(node1: Person, node2: Person): Person {
        // 若node1和node2为兄弟节点，返回node2
        if(node1.parent === node2.parent) {
            return node2
        }
        // 否则，递归往上寻找
        else {
            return this.findCommonParentNode(node1.parent, node2.parent);
        }
    }

    /**
     * 水平位移整棵树
     * @param node 该树的根节点
     * @param x 要移动到的位置
     */
    translateTree(person: Person, x: number) {
        // 计算移动的距离
        let dx = x - person.x
        // 更新节点的横坐标
        person.x = x

        // 位移所有子节点
        for(const child of person.children) {
            this.translateTree(child, child.x + dx)
        }
    }

    /**
     * 回推函数
     */
    layoutOverlaps() {
        // 外层循环，扫描hashtree，从最底层开始往上
        for(let i = this.hashTree.length - 1; i >= 0; i--) {
            // 获取当前层
            let curLayer = this.hashTree[i]

            // 内层循环，遍历该层所有节点
            for(let j = 0; j < curLayer.length - 1; j++) {
                // 获取相邻的两个节点，保存为n1，n2
                let n1 = curLayer[j], n2 = curLayer[j + 1]

                // 若n1，n2有重叠
                if(this.isOverlaps(n1, n2)) {
                    // 计算需要移动距离
                    const dx = n1.x + this.nodeInterval - n2.x
                    // 找出与n1的某个祖先为兄弟节点的n2的祖先
                    const node2Move = this.findCommonParentNode(n1, n2)
                    
                    console.log("重叠", i, n1.layer, "=>", n1.index, n2.index, ",", node2Move.layer, node2Move.index)
                    // 往右移动n2
                    this.translateTree(node2Move, node2Move.x + dx)
                    this.centerChild(node2Move.parent)

                    // 移动后下层节点有可能再次发生重叠，所以重新从底层扫描
                    i = this.hashTree.length
                }
            }
        }
    }

    /**
     * 居中所有子节点
     * @param parent 父节点：按照该父节点的位置，居中该父节点下的所有子节点
     */
    centerChild(parent: Person) {
        // 要移动的距离
        let dx = 0

        // 父节点为null，返回
        if(parent === null) return

        const children = parent.children
        // 只有一个子节点，则只要将该子节点与父节点对齐即可
        if(children.length === 1) {
            dx = parent.x - children[0].x
        }

        // > 1 的子节点，就要计算最左的子节点和最右的子节点的距离的中点与父节点的距离
        if(children.length > 1) {
            dx = parent.x - (children[0].x + (children[children.length - 1].x - children[0].x)/2)
        }

        // 若要移动的距离不为0
        if(dx) {
            // 将所有子节点居中对齐父节点
            for(const child of children) {
                this.translateTree(child, child.x + dx)
            }
        }
    }

    /**
     * 正推布局函数，将当前节点的所有子节点按等间距布局
     * @param node 当前节点
     */
    layoutChild(person: Person ) {
        const children = person.children
        const childCount = person.children.length
        // 若当前节点为叶子节点，返回
        if(childCount === 0) return
        else {
            // 计算子节点最左位置
            let start = person.x - (childCount- 1)*this.nodeInterval/2

            // 遍历子节点
            for(let i = 0 ; i < childCount; i++) {
                // 计算当前子节点横坐标
                let x = start + i*this.nodeInterval

                // 移动该子节点及以该子节点为根的整棵树
                this.translateTree(children[i], x)
                // 递归布局该子节点
                this.layoutChild(children[i])
            }
        } 
    }

    /**
     * 判断重叠函数
     * @param node1 左边的节点
     * @param node2 右边的节点
     */
    isOverlaps(node1: Person, node2: Person): boolean {
        // 若左边节点的横坐标比右边节点大，或者两节点间的间距小于最小间距，均判断为重叠
        return (node1.x - node2.x) > 0 || (node2.x - node1.x) < this.nodeInterval
    }

    /**
     * 更新需要更新的节点
     * @param node 
     */
    patch(person: Person) {
        // 若节点的当前位置不等于初始位置，则更新
        if(person.x !== person.ox) {
            // 更新节点的初始位置为当前位置
            person.updateNodePos()
            person.ox = person.x
        }

        // 递归更新子节点
        for(const child of person.children) {
            this.patch(child)
        }
    }
}


