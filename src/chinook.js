//@ts-check

import { KinshipContext } from '@kinshipjs/core';

/**
 * @param {"Album"|"Artist"|"Customer"|"Employee"|"Genre"|"Invoice"|"InvoiceLine"|"MediaType"|"Playlist"|"PlaylistTrack"|"Track"} table
 * @returns {Promise<import('./adapter.js').JsonDatabase['$data'][string]>}
 */
async function getChinookTable(table) {
    const res = await fetch(`https://raw.githubusercontent.com/marko-knoebl/chinook-database-json/master/src/data/${table}.json`);

    if(!res.ok) {
        throw Error(`${res.status}: ${res.statusText}`);
    }
    return await res.json();
}

/**
 * @returns {Promise<import('./adapter.js').JsonDatabase['$schema']>}
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

    /** @type {import('./adapter.js').JsonDatabase['$schema']} */
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

/**
 * @returns {Promise<import('./adapter.js').JsonDatabase>}
 */
export async function createChinookDatabase() {
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
    
    return {
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
}

/**
 * @param {ChinookContexts} contexts
 */
export async function configureRelationships(contexts) {
    contexts.albums.hasMany(m => m.Tracks.from(contexts.tracks, m => m.AlbumId, m => m.AlbumId));
    
    contexts.tracks
        .hasOne(m => m.Album.from(contexts.albums, m => m.AlbumId, m => m.AlbumId))
        .hasOne(m => m.Genre.from(contexts.genres, m => m.GenreId, m => m.GenreId))
        .hasMany(m => m.PlaylistTracks.from(contexts.playlistTracks, m => m.TrackId, m => m.TrackId)
            .andThatHasOne(m => m.Playlist.from(contexts.playlists, m => m.PlaylistId, m => m.PlaylistId)));
    
    
}

/**
 * @typedef {object} ChinookContexts
 * @prop {KinshipContext<Album>} albums
 * @prop {KinshipContext<Artist>} artists
 * @prop {KinshipContext<Customer>} customers
 * @prop {KinshipContext<Employee>} employees
 * @prop {KinshipContext<Genre>} genres
 * @prop {KinshipContext<Invoice>} invoices
 * @prop {KinshipContext<InvoiceLine>} invoiceLines
 * @prop {KinshipContext<MediaType>} mediaTypes
 * @prop {KinshipContext<Playlist>} playlists
 * @prop {KinshipContext<PlaylistTrack>} playlistTracks
 * @prop {KinshipContext<Track>} tracks
 */

/**
 * @typedef {object} Album
 * @prop {number} AlbumId
 * @prop {string} Title
 * @prop {number} ArtistId
 * 
 * @prop {Artist=} Artist
 * @prop {Track[]=} Tracks 
 */

/**
 * @typedef {object} Artist
 * @prop {number} ArtistId
 * @prop {string} Name
 * 
 * @prop {Album=} Album
 */

/**
 * @typedef {object} _Customer
 * @prop {number} CustomerId
 * @prop {string=} Company
 * @prop {string=} Phone
 * @prop {string=} Fax
 * @prop {string} Email
 * @prop {number=} SupportRepId
 * 
 * @prop {Employee=} SupportRepresentative
 * 
 * @typedef {Infer<_Customer & Address & TraditionalNames>} Customer
 */

/**
 * @typedef {object} _Employee
 * @prop {number} EmployeeId
 * @prop {string=} Title
 * @prop {number=} ReportsTo
 * @prop {Date=} BirthDate
 * @prop {Date=} HireDate
 * @prop {string=} Fax
 * @prop {string} Email
 * 
 * @prop {Employee=} EmployeeToReportTo
 * @prop {Customer[]=} Customers
 * 
 * @typedef {Infer<_Employee & Address & TraditionalNames>} Employee
 */

/**
 * @typedef {object} Genre
 * @prop {number} GenreId
 * @prop {string} Name
 * 
 * @prop {Track[]=} Tracks
 */

/**
 * @typedef {object} _Invoice
 * @prop {number} InvoiceId
 * @prop {number} CustomerId
 * 
 * @prop {Customer=} Customer
 * @prop {InvoiceLine[]=} InvoiceLines 
 *
 * @typedef {Infer<_Invoice & {[K in keyof Address as `Billing${K}`]-?: Address[K]}>} Invoice
 */

/**
 * @typedef {object} InvoiceLine
 * @prop {number} InvoiceLineId
 * @prop {number} InvoiceId
 * @prop {number} TrackId
 * @prop {number} UnitPrice
 * @prop {number} Quantity
 * 
 * @prop {Invoice=} Invoice
 * @prop {Track=} Track
 */

/**
 * @typedef {object} MediaType
 * @prop {number} MediaTypeId
 * @prop {string} Name
 * 
 * @prop {Track[]=} Tracks
 */

/**
 * @typedef {object} Playlist
 * @prop {number} PlaylistId
 * @prop {string} Name
 * 
 * @prop {PlaylistTrack[]=} PlaylistTracks
 */

/**
 * @typedef {object} PlaylistTrack
 * @prop {number} PlaylistId
 * @prop {number} TrackId
 * 
 * @prop {Playlist=} Playlist
 * @prop {Track=} Track
 */

/**
 * @typedef {object} Track
 * @prop {number} TrackId
 * @prop {string} Name
 * @prop {number} AlbumId
 * @prop {number} MediaTypeId
 * @prop {number} GenreId
 * @prop {string=} Composer
 * @prop {number} Milliseconds
 * @prop {number} Bytes
 * @prop {number} UnitPrice
 * 
 * @prop {Album=} Album
 * @prop {MediaType=} MediaType
 * @prop {Genre=} Genre
 * @prop {PlaylistTrack[]=} PlaylistTracks
 */

/**
 * @template {object} T
 * @typedef {{[K in keyof T]: T[K]}} Infer
 */

/**
 * @typedef {object} TraditionalNames
 * @prop {string} FirstName
 * @prop {string} LastName
 */

/**
 * @typedef {object} Address
 * @prop {string=} Address
 * @prop {string=} City
 * @prop {string=} State
 * @prop {string=} Country
 * @prop {string=} PostalCode
 */
