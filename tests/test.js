//@ts-check
import { KinshipContext } from "@kinshipjs/core";
import { adapter } from "../src/adapter.js";
import { testAdapter } from '@kinshipjs/adapter-tests';

/**
 * @param {"Album"|"Artist"|"Customer"|"Employee"|"Genre"|"Invoice"|"InvoiceLine"|"MediaType"|"Playlist"|"PlaylistTrack"|"Track"} table
 * @returns {Promise<import("../src/adapter.js").JsonDatabase['$data'][string]>} 
 */
async function getChinookTable(table) {
    const res = await fetch(`https://raw.githubusercontent.com/marko-knoebl/chinook-database-json/master/src/data/${table}.json`);

    if(!res.ok) {
        throw Error(`${res.status}: ${res.statusText}`);
    }
    return await res.json();
}

/**
 * 
 * @returns {Promise<import("../src/adapter.js").JsonDatabase['$schema']>}
 */
async function getChinookSchema() {
    const res = await fetch('https://raw.githubusercontent.com/marko-knoebl/chinook-database-json/master/src/schema.json');

    if(!res.ok) {
        throw Error(`${res.status}: ${res.statusText}`);
    }
    /** @type {any[]} */
    const schemas = await res.json();
    const types = {
        string: "string",
        integer: "int",
        "decimal(10,2)": "float",
        datetime: "date"
    }

    /** @type {import("../src/adapter.js").JsonDatabase['$schema']} */
    let schema = {};
    for(const s of schemas) {
        const { name, schema: tableSchema } = s;
        schema[name] = Object.fromEntries(tableSchema.fields.map(f => [f.name, ({
            isPrimary: tableSchema.primaryKey === f.name,
            isNullable: !(f.constraints?.required),
            datatype: types[f.type]
        })]));
    }
    return schema;
}

const Album = await getChinookTable("Album");
const Artist = await getChinookTable("Artist");
const Customer = await getChinookTable("Customer");
const Employee = await getChinookTable("Employee");
const Genre = await getChinookTable("Genre");
const Invoice = await getChinookTable("Invoice");
const InvoiceLine = await getChinookTable("InvoiceLine");
const MediaType = await getChinookTable("MediaType");
const Playlist = await getChinookTable("Playlist");
const PlaylistTrack = await getChinookTable("PlaylistTrack");
const Track = (await getChinookTable("Track"));

/** @type {import("../src/adapter.js").JsonDatabase} */
const testDatabase = {
    $schema: await getChinookSchema(),
    $data: {
        Album,
        Artist,
        Customer,
        Employee,
        Genre,
        Invoice,
        InvoiceLine,
        MediaType,
        Playlist,
        PlaylistTrack,
        Track
    }
};

const cnn = adapter(testDatabase);


// const playlist = new KinshipContext(cnn, "Playlist");
// playlist.hasMany(m => m.PlaylistTracks.fromTable("PlaylistTrack").withKeys("PlaylistId", "PlaylistId")
//     .andThatHasOne(m => m.Track.fromTable("Track").withKeys("TrackId", "TrackId")))

// console.log(JSON.stringify(await playlist.include(m => m.PlaylistTracks.thenInclude(m => m.Track)), undefined, 2));

await testAdapter(cnn);
