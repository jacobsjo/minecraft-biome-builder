import uniqid from 'uniqid'
import { BiomeRenderer } from '../UI/Renderer/BiomeRenderer'
import { GridElementRenderer } from '../UI/Renderer/ElementRenderer'
import { VanillaBiomes } from '../Vanilla/VanillaBiomes'
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from './BiomeBuilder'
import { Grid } from './Grid'
import {GridElement, Mode} from './GridElement'

export class Biome implements GridElement{
    name: string
    hidden: boolean = false
    type_id: number = 3
    readonly allowEdit: boolean = true

    public color: string
    private renderer: BiomeRenderer
    private isVanilla: boolean
    public raw_color: {
        r: number,
        g: number,
        b: number
    }

    private key: string

    private constructor(name: string, color: string, key?: string, isVanilla: boolean = false){
        this.name = name
        this.color = color
        if (key !== undefined)
            this.key = key
        else if (isVanilla)
            this.key = name
        else
            this.key = uniqid('biome_')
        this.allowEdit = !isVanilla
        this.isVanilla = isVanilla
        this.raw_color = this._hexToRgb(color)
    }

    static create(builder: BiomeBuilder, name: string, color: string, key?: string, isVanilla: boolean = false): Biome{
        const biome = new Biome(name, color, key, isVanilla)
        if (isVanilla)
            builder.registerVanillaBiome(biome)
        else
            builder.registerBiome(biome);
        return biome
    }

    
    public setColor(color: string){
        this.color = color
        this.raw_color = this._hexToRgb(color)
    }

	private _hexToRgb(hex: string) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
		  r: parseInt(result[1], 16),
		  g: parseInt(result[2], 16),
		  b: parseInt(result[3], 16)
		} : null;
	  }
      
      
    static fromJSON(builder: BiomeBuilder, json: any){
        if (builder.vanillaBiomes.has(json.key)){
            const vanillaBiome = builder.vanillaBiomes.get(json.key)

            builder.registerBiome(vanillaBiome)
            if (json.color){
                vanillaBiome.color = json.color
            }
        } else {
            const biome = new Biome(json.name, json.color ?? "#888888", json.key, false)
            builder.registerBiome(biome);
            return biome
        }
    }

    toJSON(){
        var color = undefined
        if (!this.isVanilla)
            color = this.color
        else {
            const vanillaColor = VanillaBiomes.biomes.find(b => b.key === this.getKey()).color
            if (this.color !== vanillaColor){
                color = this.color
            }
        }

        return {
            key: this.key,
            name: this.name,
            color: color
        }
    }    

    lookupKey(indexes: MultiNoiseIndexes, mode: Mode,): string{
        return this.getKey()
    }

    lookup(indexes: MultiNoiseIndexes, mode: Mode): Biome {
        return this
    }

    lookupRecursive(indexes: MultiNoiseIndexes, mode: Mode,): Biome {
        return this
    }

    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {slice: Grid, layout: Grid, biome: Biome} {
        return {slice: undefined, layout: undefined, biome: this}
    }


    getRenderer(): GridElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new BiomeRenderer(this)

        return this.renderer
    }

    getKey(){
        return this.key
    }

    has(key: string, _limit: PartialMultiNoiseIndexes){
        return (key === this.getKey())
    }

}

