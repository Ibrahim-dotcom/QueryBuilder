import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./QueryBuilder.css";

const QueryBuilder = () => {
    const [database, setDatabase] = useState({});
    const [selectedTables, setSelectedTables] = useState([]);
    const [columns, setColumns] = useState({});
    const [joins, setJoins] = useState([]);
    const [whereConditions, setWhereConditions] = useState([]);
    const [query, setQuery] = useState("");
    const [queryResult, setQueryResult] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedColumns, setSelectedColumns] = useState({});

    const [savedQueries, setSavedQueries] = useState([]);
    const [showSavedQueries, setShowSavedQueries] = useState(false);
    const [queryName, setQueryName] = useState("");

    const [tableAliases, setTableAliases] = useState({});
    const [columnAliases, setColumnAliases] = useState({});




    axios.defaults.withCredentials = true;

    // Fetch database schema (tables) and saved queries
    const fetchSavedQueries = async() => {
        axios
            .get("http://127.0.0.1:8080/api/fetch-queries/")
            .then((response) => setSavedQueries(response.data))
            .catch((err) => console.error(err));
    }

    const fetchDbInfo = async() => {
        axios
            .get("http://127.0.0.1:8080/api/database-info/")
            .then((response) => {
                setDatabase(response.data.database_info);
            });
    }
    useEffect(() => {
        fetchDbInfo();
        fetchSavedQueries();
    }, []);

    // Fetch columns of a table
    const fetchColumns = async (tableName) => {
        if (!columns[tableName]) {            await axios
                .get(`http://127.0.0.1:8080/api/columns/${tableName}/`)
                .then((res) => {
                    setColumns((prev) => ({ ...prev, [tableName]: res.data.columns }));
                    setSelectedColumns((prev) => ({
                        ...prev,
                        [tableName]: res.data.columns.reduce(
                            (acc, col) => ({ ...acc, [col]: false }),
                            { "Select All": false }
                        ),
                    }));
                })
                .catch((err) => console.error(err));
        }
    };

    // Add a table to the workspace
    const handleAddTable =  (table) => {
        if (!selectedTables.includes(table)) {
            setSelectedTables([...selectedTables, table]);
            fetchColumns(table);
        }
    };

    //save queries

    const handleSaveQuery = () => {
        if (!queryName) {
            alert("Query name is required.");
            return;
        }
    
        axios
            .post("http://127.0.0.1:8080/api/save-query/", { name: queryName, query })
            .then(() => {
                alert("Query saved successfully!");
                setQueryName("");
            })
            .catch((err) => console.error(err));
        fetchSavedQueries()
    };
    

    // Remove a table, join or where condition 
    const removeTable = (table) => {
        setSelectedTables(selectedTables.filter((t) => t !== table));
        setJoins(joins.filter((join) => join.table !== table));
        setWhereConditions(whereConditions.filter((where) => where.table !== table));
    };

    const removeJoin = (index) => {
        setJoins(joins.filter((join, ind) => ind !== index ))
    }

    const removeWhere = (index) => {
        setWhereConditions(whereConditions.filter((where, ind) => ind !== index))
    }

    // Add a join condition
    // const addJoin = () => {
    //     setJoins([...joins, { table1: "", column1: "", table2: "", column2: "" }]);
    // };

    const handleAddJoin = () => {
        setJoins([
            ...joins,
            {
                type: "INNER", // Default to INNER JOIN
                table: "", 
                onColumn: "", 
                fromColumn: "", 
            }
        ]);
    };

    // Add a WHERE condition
    const addWhere = () => {
        setWhereConditions([
            ...whereConditions,
            { table: "", column: "", operator: "=", value: "" },
        ]);
    };

    const handleAddWhereCondition = () => {
        setWhereConditions([
            ...whereConditions,
            { column: "", operator: "=", value: "" }
        ]);
    };

    // original working buildQuery fuction but no alias
    const buildQuery1 = () => {
        // Build SELECT clause
        const selectColumns = selectedTables.flatMap((table) =>
            Object.entries(selectedColumns[table] || {})
                .filter(([col, isSelected]) => col !== "Select All" && isSelected)
                .map(([col]) => `${table}.${col}`)
        );

        // Build Joins
        let joinClause = "";
        joins.forEach((join) => {
            joinClause += ` \n${join.type} JOIN \n  ${join.table} ON ${join.table}.${join.onColumn} = ${selectedTables[0]}.${join.fromColumn}`;
        });

        // Build WHERE conditions
        let whereClause = "";
        if (whereConditions.length > 0) {
            whereClause = `WHERE \n   ${whereConditions.map(cond => `${selectedTables[0]}.${cond.column} ${cond.operator} '${cond.value}'`).join(" AND ")}`;
        }

        // Final query
        const queryStr = `SELECT \n     ${selectColumns.join(", ")} \nFROM \n    ${ joinClause ? selectedTables[0]:selectedTables.join(',')} ${joinClause} \n ${whereClause}`;
        setQuery(queryStr);
    };

    const buildQuery = () => {
        let query = `SELECT 
        `;
        let selectParts = [];
    
        selectedTables.forEach((table) => {
            const alias = tableAliases[table] ? ` AS ${tableAliases[table]}` : '';
            const tableName = `${table}${alias}`;
    
            if (selectedColumns[table]) {
                Object.keys(selectedColumns[table]).forEach((column) => {
                    if (selectedColumns[table][column] && column !== 'Select All') {
                        const columnAlias = columnAliases[table] && columnAliases[table][column]
                            ? ` AS ${columnAliases[table][column]}`
                            : '';
                        selectParts.push(`${tableAliases[table] || table}.${column}${columnAlias}`);
                    }
                });
            }
        });
    
        query += `${selectParts.join(", ")}`;
        let queryFromPart = selectedTables
        .map((table) => `${table}${tableAliases[table] ? ` AS ${tableAliases[table]}` : ''}`)

        query += `${'\n'}FROM
         ${joins.length > 0 ? queryFromPart[0] : queryFromPart.join(', ')}`

        // query += ` FROM ${selectedTables
        //     .map((table) => `${table}${tableAliases[table] ? ` AS ${tableAliases[table]}` : ''}`)
        //     .join(", ")}`;
    
        // Add JOIN logic
        joins.forEach((join) => {
            query += ` ${'\n'}${join.type} JOIN ${'\n\t'}${join.table}${tableAliases[join.table] ? ` AS ${tableAliases[join.table]}` : ''}`;
            query += ` ON ${tableAliases[selectedTables[0]]||selectedTables[0]}.${join.fromColumn} = ${tableAliases[join.table] || join.table}.${join.onColumn}`;
        });
    
        // Add WHERE conditions
        if (whereConditions.length > 0) {
            query += " \nWHERE\n\t" + whereConditions
                .map((cond) => `${tableAliases[selectedTables[0]]||selectedTables[0]}.${cond.column} ${cond.operator} '${cond.value}'`)
                .join(" AND ");
        }
    
        setQuery(query);
    };
    


    //this is supposed to build the tables, joins and where conditions back from the query
    const buildTablesJoinsWhereFromQuery = (queryValue) => {
        if (!queryValue) return; // Guard against empty query strings
    
        // Reset states
        setSelectedTables([]);
        setJoins([]);
        setWhereConditions([]);
        setTableAliases({});
        setColumnAliases({});
        setQuery(queryValue);
    
        // Parse query into SELECT, FROM, and WHERE parts
        const queryParts = queryValue.split(/SELECT|FROM|WHERE/i).map((part) => part.trim());
        const selectPart = queryParts[1] || ""; // Columns part
        let fromPart = queryParts[2] || ""; // Tables and joins
        const wherePart = queryParts[3] || ""; // Where conditions
        console.log('sel part: ',selectPart,'from Part: ',  fromPart,'where part:', wherePart)
        const tables = new Set(); // To avoid duplicates
        const tempColumns = {};
        const tempJoins = [];
        const tempWhereConditions = [];
        const tableAliasMap = {}; // Maps alias to table name
        const tempTableAliases = {};
        const tempColumnAliases = {};
    
        // Handle FROM part (Tables and Joins)
        const tableRegex = /^(\w+)\s*(?:AS\s+(\w+))?/i;
        //const tableRegex = /(\w+)\s*(?:AS)?\s*(\w+)?/gi;
        const joinRegex = /(INNER|LEFT|RIGHT)?\s*JOIN\s+(\w+)\s*(?:AS)?\s*(\w+)?\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi;
        let match;
    
        // Parse tables and their aliases
        // fromPart = fromPart.replace(/\n/, '')
        fromPart.split(",").forEach((tableExpression) => {
            const [a, tableName, alias] = tableRegex.exec(tableExpression.trim()) || [];
            console.log('atableNameAlias: ', a, tableName, alias)
            if (tableName) {
                const tableAlias = alias || tableName;
                tables.add(tableName);
                tableAliasMap[tableAlias] = tableName;
                tempTableAliases[tableName] = alias || ""; // Save alias
                setSelectedTables((prev) => [...prev, tableName]);
                fetchColumns(tableName); // Fetch table columns dynamically
                //toggleColumnSelection(tableName, col)
            }
        });
    
        // Parse joins
        while ((match = joinRegex.exec(fromPart))) {
            const [, joinType, secondTable, alias, table1, column1, table2, column2] = match;
            const secondTableAlias = alias || secondTable;
    
            tempJoins.push({
                type: joinType || "INNER",
                table: secondTableAlias,
                onColumn: secondTableAlias === table1 ? column1 : column2,
                fromColumn: secondTableAlias === table1 ? column2 : column1,
            });
    
            tableAliasMap[secondTableAlias] = secondTable; // Save alias mapping
            tempTableAliases[secondTable] = alias || ""; // Save alias
        }
    
        // Handle SELECT part (Columns and Aliases)
        selectPart.split(",").forEach((columnExpression) => {
            const [rawColumn, alias] = columnExpression.trim().split(/\s+AS\s+/i);
            const [tableAlias, column] = rawColumn.split(".");
            const tableName = tableAliasMap[tableAlias] || tableAlias; // Resolve table name from alias
    
            if (!tables.has(tableName)) {
                tables.add(tableName);
                setSelectedTables((prev) => [...prev, tableName]);
                fetchColumns(tableName); // Fetch table columns dynamically
            }
    
            tempColumns[tableName] = tempColumns[tableName] || {};
            tempColumns[tableName][column] = true; // Mark column as selected
    
            if (alias) {
                tempColumnAliases[tableName] = tempColumnAliases[tableName] || {};
                tempColumnAliases[tableName][column] = alias; // Save column alias
            }
        });
    
        // Handle WHERE part (Conditions)
        const conditionRegex = /(\w+)\.(\w+)\s*(=|>|<|LIKE)\s*'?([\w%]*)'?/gi;
        while ((match = conditionRegex.exec(wherePart))) {
            const [, tableAlias, column, operator, value] = match;
            const tableName = tableAliasMap[tableAlias] || tableAlias; // Resolve table name from alias
            tempWhereConditions.push({
                table: tableName,
                column,
                operator,
                value,
            });
        }
    
        // Update state after parsing
        setSelectedColumns(tempColumns);
        setJoins(tempJoins);
        setWhereConditions(tempWhereConditions);
        setTableAliases(tempTableAliases);
        setColumnAliases(tempColumnAliases);
    };
    

    
    

    
    

    // const constructTable = (queryresult) => {
    //     const rows = queryresult.rows;
    //     const columns = queryresult.columns;
    //     let result = []

    //     rows.forEach(row => {
    //         let currentRow = {}
    //         for(let i = 0; i < row.length; i++){
    //             currentRow[columns[i]] = row[i]
    //         }
    //         result.push(currentRow)
    //     })
    //     return result
    // }

    // Execute the query
    const handleExecuteQuery = () => {
        axios
            .post("http://127.0.0.1:8080/api/execute-query/", { query })
            .then((response) => setQueryResult(response.data))
            // .then((response) => console.log(response.data))
            .catch((err) => console.error(err));
    };

    const toggleColumnSelection =  (table, column) => {
        setSelectedColumns((prev) => {
            const updatedTable = { ...prev[table], [column]: !prev[table][column]};

            // Handle "Select All"
            if (column === "Select All") {
                const allSelected = !prev[table]["Select All"];
                Object.keys(updatedTable).forEach((col) => {
                    updatedTable[col] = allSelected;
                });
            } else {
                updatedTable["Select All"] = Object.values(updatedTable).every((val) => val);
            }

            return { ...prev, [table]: updatedTable };
        });
    };


    return (
        <div>
        <div className="query-builder">
            {/* Left Sidebar */}
            <div className="sidebar">
                <h4>Tables</h4>
                <input
                    type="text"
                    placeholder="Search tables..."
                    className="form-control mb-3"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="table-list">
                    {Object.keys(database)
                        .filter((table) =>
                            table.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((table) => (
                            <div
                                key={table}
                                className="table-item"
                                onClick={() => handleAddTable(table)}
                            >
                                {table}
                            </div>
                        ))}
                </div>
            </div>

            {/* Workspace */}
            <div className="workspace">
                {/* <h4>Workspace</h4> */}
                {selectedTables.map((table) => (
                    <div key={table} className="table-box">
                        <h5 className="table-heading">
                            {/* {table} */}

                            <input
                                type="text"
                                placeholder="Alias"
                                defaultValue={tableAliases[table] || table}
                                onChange={(e) => {
                                    setTableAliases({
                                        ...tableAliases,
                                        [table]: e.target.value,
                                    });
                                }}
                                style={{ marginLeft: 10, border: 'none', outline: 'none' }}
                            />
                            <span
                                className="remove-table"
                                onClick={() => removeTable(table)}
                            >
                                &times;
                            </span>
                        </h5>
                        {columns[table] && (
                            <ul style={{listStyleType: 'none'}}>
                                <li key="select-all">
                                    <input
                                        type="checkbox"
                                        id={`select-all-${table}`}
                                        name="Select All"
                                        checked={selectedColumns[table]["Select All"] || false}
                                        onChange={() => toggleColumnSelection(table, "Select All")}
                                        style={{marginRight: 11}}
                                    />
                                    <label htmlFor={`select-all-${table}`}>Select All</label>
                                </li>
                                {columns[table].map((column) => (
                                    // <li key={col}>{col}</li>
                                    <li key={column}>
                                    <input
                                        type="checkbox"
                                        id={`${table}-${column}`}
                                        name={column}
                                        checked={selectedColumns[table][column] || false}
                                        onChange={() => toggleColumnSelection(table, column)}
                                    />
                                    {/* <label htmlFor={`${table}-${column}`}>{column}</label> */}

                                    <input
                                        type="text"
                                        placeholder="Alias"
                                        defaultValue={(columnAliases[table] && columnAliases[table][column]) || column}
                                        onChange={(e) => {
                                            setColumnAliases({
                                                ...columnAliases,
                                                [table]: {
                                                    ...columnAliases[table],
                                                    [column]: e.target.value,
                                                },
                                            });
                                        }}
                                        style={{ marginLeft: 10, outline: 'none', border: 'none' }}
                                    />
                                </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}



                
            </div>


        </div>

        
        <button className="btn btn-link" onClick={handleAddJoin}>
                    + Add Join
                </button>

        {joins.map((join, idx) => (
                            <div key={idx} className="join">
                                <select
                                    value={join.type}
                                    onChange={(e) => {
                                        const updatedJoins = [...joins];
                                        updatedJoins[idx].type = e.target.value;
                                        setJoins(updatedJoins);
                                    }}
                                >
                                    <option value="INNER">INNER JOIN</option>
                                    <option value="LEFT">LEFT JOIN</option>
                                    <option value="RIGHT">RIGHT JOIN</option>
                                </select>
                                <select
                                    value={join.table}
                                    onChange={(e) => {
                                        const updatedJoins = [...joins];
                                        updatedJoins[idx].table = e.target.value;
                                        updatedJoins[idx].onColumn = ""; // Reset join column
                                        updatedJoins[idx].fromColumn = ""; // Reset join column from the first table
                                        setJoins(updatedJoins);
                                    }}
                                >
                                    <option value="">Select Second Table</option>
                                    {selectedTables.map((table) => (
                                        <option key={table} value={table}>
                                            {table}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={join.fromColumn}
                                    onChange={(e) => {
                                        const updatedJoins = [...joins];
                                        updatedJoins[idx].fromColumn = e.target.value;
                                        setJoins(updatedJoins);
                                    }}
                                >
                                    <option value="">Select First Table Join Column</option>
                                    {selectedTables[0] && columns[selectedTables[0]]?.map((col) => (
                                        <option key={col} value={col}>
                                            {col}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={join.onColumn}
                                    onChange={(e) => {
                                        const updatedJoins = [...joins];
                                        updatedJoins[idx].onColumn = e.target.value;
                                        setJoins(updatedJoins);
                                    }}
                                >
                                    <option value="">Select Second Table Join Column</option>
                                    {join.table && columns[join.table]?.map((col) => (
                                        <option key={col} value={col}>
                                            {col}
                                        </option>
                                    ))}
                                </select>

                                <span
                                    className="remove-table"
                                    onClick={() => removeJoin(idx)}
                                >
                                    &times;
                                </span>
                            </div>
                        ))}

                <button className="btn btn-link" onClick={handleAddWhereCondition}>
                    + Add Where Condition
                </button>
            

{whereConditions.map((cond, idx) => (
                            <div key={idx} className="where-condition">
                                <select
                                    value={cond.column}
                                    onChange={(e) => {
                                        const updatedConditions = [...whereConditions];
                                        updatedConditions[idx].column = e.target.value;
                                        setWhereConditions(updatedConditions);
                                    }}
                                >
                                    <option value="">Select Column</option>
                                    {selectedTables[0] && columns[selectedTables[0]]?.map((col) => (
                                        <option key={col} value={col}>
                                            {col}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={cond.operator}
                                    onChange={(e) => {
                                        const updatedConditions = [...whereConditions];
                                        updatedConditions[idx].operator = e.target.value;
                                        setWhereConditions(updatedConditions);
                                    }}
                                >
                                    <option value="=">=</option>
                                    <option value=">">{">"}</option>
                                    <option value="<">{"<"}</option>
                                    <option value="LIKE">LIKE</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Value"
                                    value={cond.value}
                                    onChange={(e) => {
                                        const updatedConditions = [...whereConditions];
                                        updatedConditions[idx].value = e.target.value;
                                        setWhereConditions(updatedConditions);
                                    }}
                                />

                            <span
                                className="remove-table"
                                onClick={() => removeWhere(idx)}
                            >
                                &times;
                            </span>
                            </div>
                        ))}

                    {/* Right Sidebar */}
                    <div className="query-output">
                <h4>Query</h4>
                <div className="queryname-and-dropdown">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Query Name"
                    defaultValue={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                />

                <select
                    onChange={e => buildTablesJoinsWhereFromQuery(e.target.value)}
                    // className="form-control"
                >
                    <option value={''}>Select Saved Query..</option>
                    {
                        savedQueries.map(saved => (
                            <option key = {saved.id} value={saved.query}>{saved.name}</option>
                        ))
                    }
                </select>
                </div>
                <textarea
                    className="form-control"
                    style={{height: '30vh'}}
                    value={query}
                    readOnly
                />
                <button
                    className="btn btn-primary mt-2"
                    onClick={buildQuery}
                    style={{marginRight: 10}}
                >
                    Build Query
                </button>
                <button
                    className="btn btn-success mt-2"
                    onClick={handleExecuteQuery}
                >
                    Execute Query
                </button>

                <button
                    className="btn btn-info mt-2"
                    onClick={handleSaveQuery}
                    disabled={!query}
                >
                    Save Query
                </button>
            </div>

            {/* Results */}
            {(
                queryResult &&
                <div className="results">
                    <h4>Results</h4>

                        <table className="result-table">
                            <thead>
                                <tr>
                                    {queryResult.columns.map((col) => (
                                        <th key={col}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {queryResult.rows.map((row, idx) => (
                                    <tr key={idx}>
                                        {row.map((cell, i) => (
                                            <td key={`${idx}.${i}`}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                </div>
            )}
        </div>
    );
};

export default QueryBuilder;
