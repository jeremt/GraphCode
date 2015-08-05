var expect = require("chai").expect;
var pandora = require('../../bower_components/pandora/lib/pandora');
var cg = require("../../codegraph");

describe("Graph", function () {
    it("should deserialize a graph with some blocks and a connection", function () {
        var graph = new cg.Graph({
            "blocks": [
                {
                    "cgId": "0",
                    "cgInputs": [
                        {
                            "cgType": "Point",
                            "cgName": "in",
                            "cgValueType": "Number",
                            "cgValue": 64
                        }
                    ]
                },
                {
                    "cgId": "1",
                    "cgOutputs": [
                        {
                            "cgType": "Point",
                            "cgName": "out",
                            "cgValueType": "Number" // Will be deduced by default from value if possible
                        }
                    ]
                }],
            "connections": [
                {"cgOutputBlockId": "1", "cgOutputName": "out", "cgInputBlockId": "0", "cgInputName": "in"}
            ]
        });
        var blockCreateEmit = 0;
        var pointCreateEmit = 0;
        graph.on("cg-block-create", function () {
            ++blockCreateEmit;
        });
        graph.on("cg-point-create", function () {
            ++pointCreateEmit;
        });
        graph.loader.load();
        expect(graph.cgBlocks.length).to.be.equal(2);
        expect(graph.cgBlocks.length).to.be.equal(blockCreateEmit);
        expect(pointCreateEmit).to.be.equal(2);
        expect(graph.cgConnections.length).to.be.equal(1);
        expect(graph.blockById("0").inputByName("in").cgValue).to.be.equal(64);
        expect(graph.blockById("1").outputByName("out").cgValueType).to.be.equal("Number");
        graph.blockById("0").inputByName("in").cgValue = 128;
        expect(graph.blockById("0").inputByName("in").cgValue).to.be.equal(128);
        expect(graph.connectionsByPoint(graph.blockById("1").outputByName("out"))[0]).to.be.equal(graph.connectionsByPoint(graph.blockById("0").inputByName("in"))[0]);
    });
    it("should test block copy", function () {
        var graph = new cg.Graph({
            "blocks": [
                {
                    "cgId": "0",
                    "cgInputs": [
                        {
                            "cgType": "Point",
                            "cgName": "in",
                            "cgValueType": "Number",
                            "cgValue": 32
                        }
                    ]
                }, {
                    "cgId": "1",
                    "cgOutputs": [
                        {
                            "cgType": "Point",
                            "cgName": "out",
                            "cgValueType": "Number"
                        }
                    ]
                }
            ],
            "connections": [
                {"cgOutputBlockId": "1", "cgOutputName": "out", "cgInputBlockId": "0", "cgInputName": "in"}
            ]
        });
        graph.loader.load();
        var blockWithInput = graph.blockById("0");
        blockWithInput.cgName = "My custom name";
        var blockWithInputClone = blockWithInput.clone(graph);
        expect(blockWithInput.cgName).to.be.equal(blockWithInputClone.cgName);
        expect(blockWithInput.cgOutputs.length).to.be.equal(blockWithInputClone.cgOutputs.length);
        expect(blockWithInput.cgInputs.length).to.be.equal(blockWithInputClone.cgInputs.length);
        expect(blockWithInput.inputByName("in").cgValue).to.be.equal(blockWithInputClone.inputByName("in").cgValue);
    });
    it("should test block connections and streams", function () {
        var graph = new cg.Graph({
            "blocks": [
                {
                    "cgId": "0",
                    "cgInputs": [
                        {
                            "cgType": "Stream",
                            "cgName": "in"
                        }
                    ]
                }, {
                    "cgId": "1",
                    "cgOutputs": [
                        {
                            "cgType": "Stream",
                            "cgName": "out"
                        }
                    ]
                }
            ],
            "connections": [
                {"cgOutputBlockId": "1", "cgOutputName": "out", "cgInputBlockId": "0", "cgInputName": "in"}
            ]
        });
        graph.loader.load();
        expect(function () {
            graph.blockById("0").inputByName("in").cgValue = 32;
        }).to.throw(/Stream has no `cgValue`/);
    });
    it("should test many connections and clone blocks and connections", function () {
        var graph = new cg.Graph({
            "blocks": [
                {
                    "cgId": "UniqueIdCanBeAString",
                    "cgName": "on_start",
                    "cgOutputs": [
                        {
                            "cgType": "Stream",
                            "cgName": "out"
                        }
                    ]
                },
                {
                    "cgId": "0",
                    "cgName": "Sum",
                    "cgInputs": [
                        {
                            "cgType": "Point",
                            "cgName": "a",
                            "cgValueType": "Number",
                            "cgValue": 32
                        },
                        {
                            "cgType": "Point",
                            "cgName": "b",
                            "cgValueType": "Number",
                            "cgValue": 64
                        }
                    ],
                    "cgOutputs": [
                        {
                            "cgType": "Point",
                            "cgName": "sum",
                            "cgValueType": "Number"
                        }
                    ]
                },
                {
                    "cgId": "1",
                    "cgName": "Exit with code",
                    "cgOutputs": [
                        {
                            "cgType": "Stream",
                            "cgName": "out"
                        }
                    ],
                    "cgInputs": [
                        {
                            "cgType": "Stream",
                            "cgName": "in"
                        },
                        {
                            "cgType": "Point",
                            "cgName": "exit code",
                            "cgValueType": "Number",
                            "cgValue": 0
                        }
                    ]
                }
            ],
            "connections": [
                {
                    "cgOutputBlockId": "UniqueIdCanBeAString",
                    "cgOutputName": "out",
                    "cgInputBlockId": "1",
                    "cgInputName": "in"
                },
                {
                    "cgOutputBlockId": "0",
                    "cgOutputName": "sum",
                    "cgInputBlockId": "1",
                    "cgInputName": "exit code"
                }
            ]
        });
        graph.loader.load();
        var blocksCreated = 0;
        graph.on("cg-block-create", function () {
            ++blocksCreated;
        });
        var blocksCloned = graph.cloneBlocks([graph.blockById("0"), graph.blockById("1")]);
        expect(blocksCreated).to.be.equal(2);
        expect(blocksCloned[0].cgName).to.be.equal(graph.blockById("0").cgName);
        expect(blocksCloned[1].cgName).to.be.equal(graph.blockById("1").cgName);
        expect(graph.cgConnections[2].cgOutputPoint.cgName).to.be.equal(graph.cgConnections[1].cgOutputPoint.cgName);
        expect(graph.cgConnections[2].cgInputPoint.cgName).to.be.equal(graph.cgConnections[1].cgInputPoint.cgName);
    });
    it("should test remove blocks", function () {
        var graph = new cg.Graph({
            "blocks": [
                {
                    "cgId": "UniqueIdCanBeAString",
                    "cgName": "on_start",
                    "cgOutputs": [
                        {
                            "cgType": "Stream",
                            "cgName": "out"
                        }
                    ]
                },
                {
                    "cgId": "0",
                    "cgName": "Sum",
                    "cgInputs": [
                        {
                            "cgType": "Point",
                            "cgName": "a",
                            "cgValueType": "Number",
                            "cgValue": 32
                        },
                        {
                            "cgType": "Point",
                            "cgName": "b",
                            "cgValueType": "Number",
                            "cgValue": 64
                        }
                    ],
                    "cgOutputs": [
                        {
                            "cgType": "Point",
                            "cgName": "sum",
                            "cgValueType": "Number"
                        }
                    ]
                },
                {
                    "cgId": "1",
                    "cgName": "Exit with code",
                    "cgOutputs": [
                        {
                            "cgType": "Stream",
                            "cgName": "out"
                        }
                    ],
                    "cgInputs": [
                        {
                            "cgType": "Stream",
                            "cgName": "in"
                        },
                        {
                            "cgType": "Point",
                            "cgName": "exit code",
                            "cgValueType": "Number",
                            "cgValue": 0
                        }
                    ]
                }
            ],
            "connections": [
                {
                    "cgOutputBlockId": "UniqueIdCanBeAString",
                    "cgOutputName": "out",
                    "cgInputBlockId": "1",
                    "cgInputName": "in"
                },
                {
                    "cgOutputBlockId": "0",
                    "cgOutputName": "sum",
                    "cgInputBlockId": "1",
                    "cgInputName": "exit code"
                }
            ]
        });
        graph.loader.load();
        expect(graph.cgBlocks.length).to.be.equal(3);
        expect(graph.cgConnections.length).to.be.equal(2);
        graph.removeBlock(graph.blockById("UniqueIdCanBeAString"));
        expect(graph.cgBlocks.length).to.be.equal(2);
        expect(graph.cgConnections.length).to.be.equal(1);
        expect(graph.blockById.bind(graph, "UniqueIdCanBeAString")).to.throw();
    });
    it("should test connection type conversion", function () {
        var graph = new cg.Graph({
            "blocks": [
                {
                    "cgId": "0",
                    "cgOutputs": [
                        {
                            "cgType": "Point",
                            "cgName": "helloN",
                            "cgValueType": "Number"
                        }
                    ]
                },
                {
                    "cgId": "1",
                    "cgInputs": [
                        {
                            "cgType": "Point",
                            "cgName": "helloS",
                            "cgValueType": "String"
                        }
                    ]
                },
                {
                    "cgId": "2",
                    "cgInputs": [
                        {
                            "cgType": "Point",
                            "cgName": "helloB",
                            "cgValueType": "Boolean"
                        }
                    ]
                }
            ],
            "connections": [
                {
                    "cgOutputBlockId": "0",
                    "cgOutputName": "helloN",
                    "cgInputBlockId": "2",
                    "cgInputName": "helloB"
                }
            ]
        });
        graph.loader.load();
        expect(graph.blockById("0").outputByName("helloN").cgValueType).to.be.equal("Number");
        expect(graph.blockById("1").inputByName("helloS").cgValueType).to.be.equal("String");
        graph.blockById("2").inputByName("helloB").cgValue = true;
        expect(graph.blockById("2").inputByName("helloB").cgValueType).to.be.equal("Boolean");
        expect(function () {
            graph.blockById("1").inputByName("helloS").cgValue = [32, 64];
        }).to.throw(/Point::cgValue Invalid value `32,64` for `String` in `helloS`/);
        //expect(function () {
        //    graph.blockById("1").inputByName("helloS").cgValue = [32, 64];
        //}).to.throw(/connected point `helloN` does not allow the value type: `Array`/);
        //graph.blockById("1").inputByName("helloS").cgValue = [32, 64];
    });
    it("should test template blocks", function () {
        var graph = new cg.Graph({
            "blocks": [
                {
                    "cgId": "0",
                    "cgName": "mix",
                    "cgTemplates": {
                        "genType": ["Number", "Vec2", "Vec3", "Vec4"]
                    },
                    "cgInputs": [
                        {
                            "cgType": "Point",
                            "cgName": "x",
                            "cgTemplate": "genType",
                            "cgValueType": "Number"
                        },
                        {
                            "cgType": "Point",
                            "cgName": "y",
                            "cgTemplate": "genType",
                            "cgValueType": "Number"
                        },
                        {
                            "cgType": "Point",
                            "cgName": "a",
                            "cgValueType": "Number"
                        }
                    ],
                    "cgOutputs": [
                        {
                            "cgType": "Point",
                            "cgName": "value",
                            "cgTemplate": "genType",
                            "cgValueType": "Number"
                        }
                    ]
                },
                {
                    "cgId": "1",
                    "cgName": "position",
                    "cgOutputs": [
                        {
                            "cgType": "Point",
                            "cgName": "value",
                            "cgValueType": "Vec3"
                        }
                    ]
                },
                {
                    "cgId": "2",
                    "cgName": "message",
                    "cgOutputs": [
                        {
                            "cgType": "Point",
                            "cgName": "value",
                            "cgValueType": "String"
                        }
                    ]
                }
            ],
            "connections": [
                {"cgOutputBlockId": "1", "cgOutputName": "value", "cgInputBlockId": "0", "cgInputName": "x"}
            ]
        });
        graph.loader.load();
        expect(graph.blockById("0").inputByName("x").cgValueType).to.be.equal("Vec3");
        expect(graph.blockById("0").inputByName("y").cgValueType).to.be.equal("Vec3");
        expect(graph.blockById("0").inputByName("a").cgValueType).to.be.equal("Number");
        expect(graph.blockById("0").outputByName("value").cgValueType).to.be.equal("Vec3");
        expect(function () {
            graph.blockById("0").inputByName("y").connect(graph.blockById("2").outputByName("value"))
        }).to.throw(/Graph::connectPoints\(\) Cannot connect two points of different value types: `String` and `Vec3`/);
    });
    it("should test some basic error", function () {
        var testLoad = function (blocks, connections) {
            return function () {
                var graph = new cg.Graph({
                    blocks: blocks,
                    connections: connections
                });
                graph.loader.load();
            };
        };
        expect(testLoad([
            {"": ""}
        ])).to.throw(/`cgId` is required/); // cgId is required
        expect(testLoad([
            {"cgId": "1"},
            {"cgId": "1"}
        ])).to.throw(/id `\d` already exists/); // cgId is not unique
        expect(testLoad([
            {
                "cgId": "2",
                "cgOutputs": [
                    {"": ""}
                ]
            }
        ])).to.throw(/`cgName` is required/);
        expect(testLoad([
            {
                "cgId": "3",
                "cgOutputs": [
                    {"cgType": "Point", "cgName": "hello"}
                ]
            }
        ])).to.throw(/Cannot create the point `hello` in block `3` without specifying a value type/);
        expect(testLoad([
            {
                "cgId": "4",
                "cgOutputs": [
                    {
                        "cgType": "Point",
                        "cgName": "hello",
                        "cgValueType": "Number"
                    }
                ]
            },
            {
                "cgId": "5",
                "cgInputs": [
                    {
                        "cgType": "Point",
                        "cgName": "hello",
                        "cgValueType": "Array"
                    }
                ]
            }
        ], [
            {
                "cgOutputBlockId": "4",
                "cgOutputName": "hello",
                "cgInputBlockId": "5",
                "cgInputName": "hello"
            }])).to.throw(/Cannot connect two points of different value types: `[0-9a-zA-Z-_]+` and `[0-9a-zA-Z-_]+`/);
        expect(testLoad([
            {
                "cgId": "7",
                "cgOutputs": [
                    {
                        "cgType": "Point",
                        "cgName": "hello",
                        "cgValueType": "Number"
                    }
                ]
            },
            {
                "cgId": "8",
                "cgInputs": [
                    {
                        "cgType": "Point",
                        "cgName": "hello",
                        "cgValueType": "Number"
                    }
                ]
            },
            {
                "cgId": "9",
                "cgInputs": [
                    {
                        "cgType": "Point",
                        "cgName": "hello",
                        "cgValueType": "Number"
                    }
                ]
            }
        ], [
            {"cgOutputBlockId": "7", "cgOutputName": "hello", "cgInputBlockId": "8", "cgInputName": "hello"},
            {"cgOutputBlockId": "7", "cgOutputName": "hello", "cgInputBlockId": "9", "cgInputName": "hello"}
        ])).to.throw(/Cannot accept more than `\d` connection/);
    });
    it("should test native blocks", function () {
        var graph = new cg.Graph({
            "blocks": [
                {
                    "cgId": "0",
                    "cgType": "Instruction",
                    "cgName": "print",
                    "cgInputs": [
                        {
                            "cgType": "Point",
                            "cgValueType": "String",
                            "cgName": "message"
                        }
                    ]
                },
                {
                    "cgId": "1",
                    "cgType": "Instruction",
                    "cgName": "add_string",
                    "cgInputs": [
                        {
                            "cgType": "Point",
                            "cgValueType": "String",
                            "cgName": "str"
                        }
                    ],
                    "cgReturn": {"cgValueType": "String"}
                },
                {
                    "cgId": "2",
                    "cgType": "Function",
                    "cgName": "rand",
                    "cgReturn": {"cgValueType": "Number"}
                },
                {
                    "cgId": "3",
                    "cgType": "Getter",
                    "cgName": "Entity.name",
                    "cgClassType": "Entity",
                    "cgValueType": "String"
                },
                {
                    "cgId": "4",
                    "cgType": "Each"
                },
                {
                    "cgId": "5",
                    "cgType": "Range"
                },
                {
                    "cgId": "6",
                    "cgType": "Condition"
                },
                {
                    "cgId": "7",
                    "cgType": "Variable",
                    "cgName": "size",
                    "cgValueType": "Number"
                },
                {
                    "cgId": "8",
                    "cgType": "Value",
                    "cgValueType": "Number",
                    "cgValue": 10
                }
            ]
        });
        graph.loader.load();
        expect(pandora.typename(graph.blockById("0").cgInputs[0])).to.be.equal("Stream");
        expect(pandora.typename(graph.blockById("0").cgOutputs[0])).to.be.equal("Stream");
        expect(graph.blockById("0").cgName).to.be.equal("print");
        expect(graph.blockById("0").cgInputs[1].cgValueType).to.be.equal("String");
        expect(pandora.typename(graph.blockById("1").cgInputs[0])).to.be.equal("Stream");
        expect(pandora.typename(graph.blockById("1").cgOutputs[0])).to.be.equal("Stream");
        expect(graph.blockById("1").cgOutputs[1].cgValueType).to.be.equal("String");
        expect(graph.blockById("2").cgOutputs[0].cgValueType).to.be.equal("Number");
        expect(graph.blockById("3").cgOutputs[0].cgValueType).to.be.equal("String");
        expect(graph.blockById("3").cgInputs[0].cgValueType).to.be.equal("Entity");
        expect(graph.blockById("7").cgOutputs[0].cgValueType).to.be.equal("Number");
        expect(graph.blockById("7").cgName).to.be.equal("size");
        expect(graph.blockById("7").cgValueType).to.be.equal("Number");
        expect(graph.blockById("8").cgValue).to.be.equal(10);
    });
    it("should test models", function () {
        var graph = new cg.Graph({
            "blocks": [
                {"cgId": "0", "cgModel": "do_stuff"},
                {"cgId": "1", "cgModel": "do_stuff", "cgName": "custom_name"}
            ]
        }, {
            "do_stuff": {
                "cgInputs": [
                    {
                        "cgType": "Point",
                        "cgName": "is_true",
                        "cgValueType": "Boolean"
                    }
                ]
            }
        });
        graph.loader.load();
        expect(graph.blockById("0").cgInputs[0].cgName).to.be.equal("is_true");
        expect(graph.blockById("0").cgName).to.be.equal("do_stuff");
        expect(graph.blockById("1").cgName).to.be.equal("custom_name");
    });
});