//@ts-check
import { KinshipContext } from "@kinshipjs/core";
import { adapter } from "../src/adapter.js";
import { testAdapter } from '@kinshipjs/adapter-tests';

/** @type {import("../src/adapter.js").JsonDatabase} */
const database = {
    $schema: {
        Car: {
            Id: {
                table: "Car",
                field: "Id",
                alias: "",
                isPrimary: true,
                isIdentity: true,
                isVirtual: false,
                isNullable: false,
                isUnique: true,
                defaultValue: () => undefined,
                commandAlias: "",
                datatype: "int"
            },
            Make: {
                table: "Car",
                field: "Make",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                defaultValue: () => undefined,
                datatype: "string"
            },
            Model: {
                table: "Car",
                field: "Model",
                alias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                defaultValue: () => undefined,
                commandAlias: "",
                isNullable: false,
                isUnique: false,
                datatype: "string"
            },
            Color: {
                table: "Car",
                field: "Color",
                alias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                defaultValue: () => undefined,
                commandAlias: "",
                isNullable: false,
                isUnique: false,
                datatype: "string"
            },
            Year: {
                table: "Car",
                field: "Year",
                alias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                defaultValue: () => undefined,
                commandAlias: "",
                isNullable: false,
                isUnique: false,
                datatype: "string"
            },
            Mileage: {
                table: "Car",
                field: "Mileage",
                alias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                defaultValue: () => undefined,
                commandAlias: "",
                isNullable: false,
                isUnique: false,
                datatype: "string"
            },
            MPGHwy: {
                table: "Car",
                field: "MPGHwy",
                alias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                defaultValue: () => undefined,
                commandAlias: "",
                isNullable: false,
                isUnique: false,
                datatype: "string"
            },
            MPGCity: {
                table: "Car",
                field: "MPGCity",
                alias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                defaultValue: () => undefined,
                commandAlias: "",
                isNullable: false,
                isUnique: false,
                datatype: "string"
            },
        },
        User: {
            Id: {
                table: "User",
                field: "Id",
                alias: "",
                isPrimary: true,
                isIdentity: true,
                isVirtual: false,
                defaultValue: () => undefined,
                commandAlias: "",
                isNullable: false,
                isUnique: false,
                datatype: "string"
            },
            FirstName: {
                table: "User",
                field: "FirstName",
                alias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                defaultValue: function () {
                    throw new Error("Function not implemented.");
                },
                commandAlias: "",
                isNullable: false,
                isUnique: false,
                datatype: "string"
            },
            LastName: {
                table: "User",
                field: "LastName",
                alias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                defaultValue: function () {
                    throw new Error("Function not implemented.");
                },
                commandAlias: "",
                isNullable: false,
                isUnique: false,
                datatype: "string"
            }
        }
    },
    $data: {
        Car: [
            { Id: 1, Make: "Ford", Model: "Focus", Color: "Yellow", Year: 2020, Mileage: 32145, MPGHwy: 37.6, MPGCity: 26.2 },
            { Id: 2, Make: "Toyota", Model: "Tundra", Color: "Red", Year: 2014, Mileage: 121419, MPGHwy: 32.9, MPGCity: 21.7 },
            { Id: 3, Make: "Ford", Model: "Fusion", Color: "Red", Year: 2019, Mileage: 69225, MPGHwy: 34.3, MPGCity: 26.9 },
            { Id: 4, Make: "Chevy", Model: "Equinox", Color: "Red", Year: 2022, Mileage: 17143, MPGHwy: 35.1, MPGCity: 22.4 },
            { Id: 5, Make: "Ford", Model: "Escape", Color: "Blue", Year: 2022, Mileage: 13417, MPGHwy: 34.9, MPGCity: 20.6 },
            { Id: 6, Make: "Toyota", Model: "Tacoma", Color: "Blue", Year: 2023, Mileage: 499, MPGHwy: 29.7, MPGCity: 16.4 },
            { Id: 7, Make: "Ford", Model: "F150", Color: "Blue", Year: 2020, Mileage: 51222, MPGHwy: 28.6, MPGCity: 17.0 },
            { Id: 8, Make: "Chevy", Model: "Malibu", Color: "White", Year: 2018, Mileage: 67446, MPGHwy: 37.2, MPGCity: 23.7 },
            { Id: 9, Make: "Toyota", Model: "Tacoma", Color: "White", Year: 2023, Mileage: 2747, MPGHwy: 30.1, MPGCity: 16.8 },
            { Id: 10, Make: "Dodge", Model: "Charger", Color: "White", Year: 2022, Mileage: 7698, MPGHwy: 29.9, MPGCity: 14.1 },
            { Id: 11, Make: "Toyota", Model: "RAV4", Color: "Black", Year: 2021, Mileage: 21567, MPGHwy: 28.2, MPGCity: 13.8 },
            { Id: 12, Make: "Toyota", Model: "RAV4", Color: "Black", Year: 2013, Mileage: 123411, MPGHwy: 28.1, MPGCity: 14.1 },
            { Id: 13, Make: "Dodge", Model: "Hornet", Color: "Black", Year: 2013, Mileage: 108753, MPGHwy: 31.5, MPGCity: 16.9 },
            { Id: 14, Make: "Chevy", Model: "Malibu", Color: "Silver", Year: 2021, Mileage: 14353, MPGHwy: 34.9, MPGCity: 20.0 },
            { Id: 15, Make: "Dodge", Model: "Charger", Color: "Silver", Year: 2020, Mileage: 92442, MPGHwy: 26.6, MPGCity: 13.1 },
        ]
    }
};

/**
 * @typedef {object} User
 * @prop {number=} Id
 * @prop {string} FirstName
 * @prop {string} LastName
 * @prop {number=} CarId
 * @prop {Car=} Car
 */

/**
 * @typedef {object} Car
 * @prop {number=} Id
 * @prop {string} Make
 * @prop {string} Model
 * @prop {string} Color
 * @prop {number} Year
 * @prop {number} Mileage 
 * @prop {number} MPGCity 
 * @prop {number} MPGHwy
 * @prop {User} Owner 
 */

/** @type {import("../src/adapter.js").JsonDatabase} */
const testDatabase = {
    $schema: {
        Track: {
            TrackId: {
                table: "Track",
                field: "TrackId",
                alias: "",
                commandAlias: "",
                isPrimary: true,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: true,
                datatype: "int",
                defaultValue: () => undefined
            },
            Name: {
                table: "Track",
                field: "Name",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: "string",
                defaultValue: () => undefined
            },
            AlbumId: {
                table: "Track",
                field: "AlbumId",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: true,
                isUnique: false,
                datatype: "int",
                defaultValue: () => undefined
            },
            GenreId: {
                table: "Track",
                field: "GenreId",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: true,
                isUnique: false,
                datatype: "int",
                defaultValue: () => undefined
            },
            Composer: {
                table: "Track",
                field: "Composer",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: true,
                isUnique: false,
                datatype: "string",
                defaultValue: () => undefined
            },
            Milliseconds: {
                table: "Track",
                field: "Milliseconds",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: "int",
                defaultValue: () => undefined
            },
            Bytes: {
                table: "Track",
                field: "Bytes",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: true,
                isUnique: false,
                datatype: "int",
                defaultValue: () => undefined
            },
            UnitPrice: {
                table: "Track",
                field: "UnitPrice",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: "float",
                defaultValue: () => undefined
            }
        },
        PlaylistTrack: {
            PlaylistId: {
                table: "PlaylistTrack",
                field: "PlaylistId",
                alias: "",
                commandAlias: "",
                isPrimary: true,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: true,
                datatype: "int",
                defaultValue: () => undefined
            },
            TrackId: {
                table: "PlaylistTrack",
                field: "TrackId",
                alias: "",
                commandAlias: "",
                isPrimary: true,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: true,
                datatype: "int",
                defaultValue: () => undefined
            }
        },
        Playlist: {
            PlaylistId: {
                table: "Playlist",
                field: "PlaylistId",
                alias: "",
                commandAlias: "",
                isPrimary: true,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: true,
                datatype: "int",
                defaultValue: () => undefined
            },
            Name: {
                table: "Playlist",
                field: "Name",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: true,
                isUnique: false,
                datatype: "string",
                defaultValue: () => undefined
            }
        },
        Genre: {
            GenreId: {
                table: "Genre",
                field: "GenreId",
                alias: "",
                commandAlias: "",
                isPrimary: true,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: true,
                datatype: "int",
                defaultValue: () => undefined
            },
            Name: {
                table: "Genre",
                field: "Name",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: true,
                isUnique: false,
                datatype: "string",
                defaultValue: () => undefined
            }
        },
        Album: {
            AlbumId: {
                table: "Album",
                field: "AlbumId",
                alias: "",
                commandAlias: "",
                isPrimary: true,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: true,
                datatype: "int",
                defaultValue: () => undefined
            },
            Title: {
                table: "Album",
                field: "Title",
                alias: "",
                commandAlias: "",
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: "string",
                defaultValue: () => undefined
            }
        }
    },
    $data: {
        Track: [],
        PlaylistTrack: [],
        Playlist: [],
        Genre: [],
        Album: []
    }
}

await testAdapter(adapter(testDatabase));