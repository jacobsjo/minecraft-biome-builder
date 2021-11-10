import { isString } from 'lodash';
import * as uniqid from 'uniqid';
import { BiomeGridRenderer } from '../UI/Renderer/BiomeGridRenderer';
import { Biome } from './Biome';
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from './BiomeBuilder';
import { GridElement, Mode } from './GridElement';
import { Layout } from './Layout';

export class Slice implements GridElement{
    allowEdit: boolean = true
    name: string;
    type_id: number = 1
    hidden: boolean
    private array: string[][]
    private builder: BiomeBuilder
    private renderer: BiomeGridRenderer
    private key: string

    private undoActions: {c_id: number, e_id: number, value: string}[]

    
    private constructor(builder: BiomeBuilder, name: string, array: string[][], key?: string){
        this.name = name;
        this.builder = builder;

        this.array = array;
        this.key = key ?? uniqid('slice_')
        this.undoActions = []
    }

    static create(builder: BiomeBuilder, name: string, fill: string): Slice{
        const slice = new Slice(builder, name, new Array(builder.getNumContinentalnesses()).fill(0).map(() => new Array(builder.getNumErosions()).fill(fill)));
        builder.registerGridElement(slice);
        return slice
    }

    static fromJSON(builder: BiomeBuilder, json: any){
        const slice = new Slice(builder, json.name, json.array, json.key)
        builder.registerGridElement(slice);
        return slice
    }

    toJSON(){
        return {
            key: this.key,
            name: this.name,
            array: this.array.map(row => row.map(e => this.builder.getLayoutElement(e).getKey()))
        }
    }

    getSize(): [number, number]{
        return [this.builder.getNumContinentalnesses(), this.builder.getNumErosions()]
    }

    set(indexes: PartialMultiNoiseIndexes, element: string){
        console.log(element)
        if (indexes.c_idx === undefined || indexes.e_idx === undefined)
            throw new Error("Trying to set element of Slice without proper ids")

        if (this.array[indexes.c_idx][indexes.e_idx] === element)
            return

        this.undoActions.push({c_id: indexes.c_idx, e_id: indexes.e_idx, value: this.array[indexes.c_idx][indexes.e_idx]})
        
        this.array[indexes.c_idx][indexes.e_idx] = element
        console.log(this.array)
        this.builder.hasChanges = true
    }

    undo(){
        if (this.undoActions.length > 0){
            const action = this.undoActions.pop()
            this.array[action.c_id][action.e_id] = action.value
        }
    }

    deleteParam(param: "continentalness"|"erosion", id: number){
        if (param === "continentalness"){
            this.array.splice(id, 1)
        } else {
            this.array.forEach(row => row.splice(id, 1))
        }
    }

    splitParam(param: "continentalness"|"erosion", id: number){
        if (param === "continentalness"){
            this.array.splice(id, 0, Array.from(this.array[id]))
        } else {
            this.array.forEach(row => row.splice(id, 0, row[id]))
        }
    }

    deleteGridElement(key: string){
        for (let r in this.array){
            for (let c in this.array[r]){
                if (this.array[r][c] === key){
                    this.array[r][c] = "unassigned";
                }
            }
        }
    }

    lookupKey(indexes: PartialMultiNoiseIndexes, _mode: Mode): string{
        if (indexes.c_idx === undefined || indexes.e_idx === undefined)
            throw new Error("Trying to look up element of Slice without proper ids")

        return this.array[indexes.c_idx][indexes.e_idx]
    }

    lookup(indexes: PartialMultiNoiseIndexes, mode: Mode): GridElement{
        const key = this.lookupKey(indexes, mode)
        return this.builder.getLayoutElement(key)
    }

    lookupRecursive(indexes: MultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean, stopAtLayout?: boolean): GridElement {
        const element = this.lookup(indexes, mode)
        if (stopAtHidden && element.hidden)
            return element
        else if (stopAtLayout && !(element instanceof Slice)){
            return element
        } else {
            return element.lookupRecursive(indexes, mode, stopAtHidden);
        }
    }

    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {slice: Slice, layout: Layout, biome: Biome} {
        const element = this.lookup(indexes, mode)
        if (stopAtHidden && element.hidden)
            return {slice: this, layout: undefined, biome: undefined}
        else {
            const lookup = element.lookupRecursiveWithTracking(indexes, mode, stopAtHidden)
            return {slice: this, layout: lookup.layout, biome: lookup.biome}
        }
    }

    getRenderer(): BiomeGridRenderer {
        if (this.renderer === undefined)
            this.renderer = new BiomeGridRenderer(this)

        return this.renderer
    }

    public cellToIds(x: number, y: number): PartialMultiNoiseIndexes {
        return { e_idx: x, c_idx: y }
    }

    public idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all" {
        if (indexes.e_idx === undefined || indexes.c_idx === undefined)
            return "all"

        return [indexes.e_idx, indexes.c_idx]
    }

    getKey(){
        return this.key
    }

    has(key: string, limit: PartialMultiNoiseIndexes){
        if (key === this.getKey()) return true

        if (limit.c_idx === undefined || limit.e_idx === undefined){
            return this.array.findIndex(row => row.findIndex(element => this.builder.getLayoutElement(element).has(key, limit)) >= 0) >= 0
        } else {
            return this.lookup(limit, "Any").has(key, limit)
        }
    }
}