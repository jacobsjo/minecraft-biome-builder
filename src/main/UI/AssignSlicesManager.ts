import { slice } from "lodash"
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { MenuManager } from "./MenuManager"
import { UI } from "./UI"


export class AssignSlicesManager {
    private builder: BiomeBuilder
    private title: HTMLInputElement
    private div: HTMLElement
    private splineCanvas: HTMLCanvasElement

    private undoActions: {w_idx: number, value: string}[]

    constructor(builder: BiomeBuilder) {
        this.builder = builder

        this.title = document.getElementById("layoutName") as HTMLInputElement
        this.div = document.getElementById("assignSlices")
        this.splineCanvas = document.getElementById("splineDisplayCanvas") as HTMLCanvasElement
        this.undoActions = []

    }

    refresh() {
        UI.getInstance().splineDisplayManager.setPos(undefined)
        UI.getInstance().splineDisplayManager.setWeirdnesses([])

        this.title.readOnly = true
        this.title.value = "Assign Slices"
        this.div.classList.remove("hidden")
        this.div.innerHTML = ""
        const table = document.createElement("table")
        this.builder.weirdnesses.forEach((weirdness, w_idx) => {
            const element = this.builder.getRenderedElement(weirdness[2])

            const row = document.createElement("tr")

            const name_col = document.createElement("td")
            name_col.innerHTML = weirdness[0] + ": "
            name_col.classList.add("weirdness_name")
            row.appendChild(name_col)

            const slice_icon_col = document.createElement("td")
            slice_icon_col.classList.add("slice_icon")

            const slice_icon = document.createElement("canvas") as HTMLCanvasElement
            slice_icon.width = 100
            slice_icon.height = 100
            element.getRenderer().draw(slice_icon.getContext('2d'), 0, 0, 100, 100, -1, -1, false, true)

            slice_icon_col.appendChild(slice_icon)

            row.appendChild(slice_icon_col)

            const slice_name_col = document.createElement("td")
            slice_name_col.innerHTML = element.name
            slice_name_col.classList.add("slice_name")
            row.appendChild(slice_name_col)

            const slice_mode_select_col = document.createElement("td")
            slice_mode_select_col.classList.add("slice_mode_select")

            const slice_mode_select_img = document.createElement("img") as HTMLImageElement
            slice_mode_select_img.src = "mode_" + weirdness[3] + ".png"
            slice_mode_select_img.onclick = (evt: MouseEvent) => {
                this.builder.weirdnesses[w_idx][3] = weirdness[3] === "A" ? "B" : "A"
                UI.getInstance().refresh()
                evt.preventDefault()
                evt.stopPropagation()
            }

            slice_mode_select_col.appendChild(slice_mode_select_img)

            row.onclick = (evt) => {
                if (evt.altKey) {
                    UI.getInstance().sidebarManager.selectElement({type: "slice", key: this.builder.weirdnesses[w_idx][2]})
                    UI.getInstance().refresh()
                } else {
                    if (UI.getInstance().selectedElement !== "" && this.builder.weirdnesses[w_idx][2] !== UI.getInstance().selectedElement) {
                        this.builder.hasChanges = true
                        this.undoActions.push({w_idx: w_idx, value: this.builder.weirdnesses[w_idx][2]})
                        this.builder.weirdnesses[w_idx][2] = UI.getInstance().selectedElement
                        UI.getInstance().refresh()
                    }
                }
            }

            row.oncontextmenu = (evt) => {
                if (this.builder.weirdnesses[w_idx][2] !== "unassigned"){
                    UI.getInstance().sidebarManager.openElement({type: "slice", key: this.builder.weirdnesses[w_idx][2]})
                    UI.getInstance().refresh()
                }
                evt.preventDefault()
            }

            row.onmouseover = (evt) => {
                MenuManager.toggleAction("paint", true)
                MenuManager.toggleAction("open", this.builder.weirdnesses[w_idx][2] !== "unassigned")
                UI.getInstance().splineDisplayManager.setWeirdnesses([weirdness[1]])
                UI.getInstance().splineDisplayManager.refresh()
            }

            row.appendChild(slice_mode_select_col)


            table.appendChild(row)
        })
        const t = this
        table.onmouseout = (evt) => {
            if (!t.div.classList.contains('hidden')){
                UI.getInstance().splineDisplayManager.setWeirdnesses([])
                UI.getInstance().splineDisplayManager.refresh()
                MenuManager.toggleAction("paint", false)
                MenuManager.toggleAction("open", false)

            }
        }

        this.div.appendChild(table)

        this.div.tabIndex = 1

        this.div.focus()

        this.div.onkeydown = (evt: KeyboardEvent) => {
            if (evt.key === "z" && (evt.ctrlKey || evt.metaKey) && this.undoActions.length > 0){
                const action = this.undoActions.pop()
                this.builder.weirdnesses[action.w_idx][2] = action.value
                UI.getInstance().refresh()
            }

        }

    }

    hide() {
        this.div.classList.add("hidden")
    }
}
