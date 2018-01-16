const glob = require("glob")
const fs = require('fs')
const path = require('path')
const Duration = require('duration')
const JSMinifier = require('minifier')
const HTMLMinifier = require('html-minifier')
const rimraf = require('rimraf')
const copy = require('recursive-copy')
const through = require('through2')
const jsonminify = require("jsonminify")


const SYSTEM_COMPONENTS = ['ng.NgFor']


class SourceComponent {
    constructor(name, filePath, dependencies, dependants) {
        this.name = name
        this.filePath = filePath
        this.dependencies = dependencies
        this.dependants = dependants
    }
}



(function buildProject() {
    var startTime = null

    markStart()
        .then(() => cleanOutputFolder())
        .then(() => buildDependencyTree())
        .then(componentOrder => compressJSSources(componentOrder))
        .then(() => reallocateAndCompressAssets())
        .then(() => compressHTMLSources())
        .then(() => { finish() })
        .catch(err => console.error(err))


    function markStart() {
        return new Promise((resolve, reject) => {
            startTime = new Date()
            console.info("Building project...")
            resolve()
        })
    }

    function finish() {
        var endTime = new Date()
        var duration = new Duration(startTime, endTime)
        console.info("Build done. Took " + duration.toString(1) + ".")
    }

    function cleanOutputFolder() {
        return new Promise((resolve, reject) => {
            console.info("|- Clean output folder")
            rimraf.sync("./out")
            fs.mkdirSync("./out")
            fs.mkdirSync("./out/resources")
            fs.mkdirSync("./out/lib")
            fs.mkdirSync("./out/components")

            resolve()
        })
    }

    function buildDependencyTree() {
        return new Promise((resolve, reject) => {
            console.info("|- Build component tree")
    
            var components = []
            var componentOrder = []
            
            glob("./src/app/**/*.js", (err, files) => {
                files.forEach(function(file, idx, files) {
                    fs.readFile(file, 'utf-8', (err, content) => {
                        if (err) {
                            console.log(err)
                            reject(err)
                        }
    
                        var fileContent = content.toString()
                    
                        var sourceComponentName = null
                        var ngComponentNameMatch = /var\s(\w+)\s=\sng/.exec(fileContent)
                        if (ngComponentNameMatch == null) {
                            var serviceNameMatch = /var\s(\w+)\s=\sfunction\s{0,1}\(\)\s{0,1}\{\s{0,1}\}/.exec(fileContent)
                            if (serviceNameMatch != null) {
                                sourceComponentName = serviceNameMatch[1]
                            }
                        } else {
                            sourceComponentName = ngComponentNameMatch[1]
                        }
    
                        if (sourceComponentName != null) {
                            var subjectSourceComponent = getOrCreateComponent(sourceComponentName)
    
                            if (subjectSourceComponent != null) {
                                if (subjectSourceComponent.filePath == null) {
                                    subjectSourceComponent.filePath = file
                                }
    
                                var directivesMatch = /directives:\s\[(((\w|\.)+(,\s){0,1})*)\]/.exec(fileContent)
                                if (directivesMatch != null) {
                                    var directives = directivesMatch[1].split(", ")
                                    directives.forEach(function(name) {
                                        var dependency = getOrCreateComponent(name)
    
                                        if (dependency != null) {
                                            subjectSourceComponent.dependencies.push(dependency.name)
                                            dependency.dependants.push(subjectSourceComponent.name)
                                        }
                                    })
                                }
    
                                var bindingsMatch = /bindings:\s\[(((\w|\.)+(,\s){0,1})*)\]/.exec(fileContent)
                                if (bindingsMatch != null) {
                                    var directives = bindingsMatch[1].split(", ")
                                    directives.forEach(function(name) {
                                        var dependency = getOrCreateComponent(name)
    
                                        if (dependency != null) {
                                            subjectSourceComponent.dependencies.push(dependency.name)
                                            dependency.dependants.push(subjectSourceComponent.name)
                                        }
                                    })
                                }
                            }
                        }
    
                        if (idx == files.length - 1) {
                            orderDependencies(findRootComponent())
                            resolve(componentOrder)
                        }
                    })
                })
            })
    
            function getOrCreateComponent(name) {
                if (isSystemComponent(name)) {
                    return null
                } else {
                    var c = components.find(function(e){ return e.name === name })
            
                    if (c == undefined) {
                        c = new SourceComponent(name, null, [], [])
                        components.push(c)
                    }
            
                    return c
                }
            }
            
            function isSystemComponent(name) {
                if (SYSTEM_COMPONENTS.find(function(e){ return e === name }) == undefined) {
                    return false
                } else {
                    return true
                }
            }
            
            function findRootComponent() {
                return components.find(c => c.dependants.length == 0)
            }
            
            function orderDependencies(component) {
                component.dependencies.forEach(d =>
                    orderDependencies(getOrCreateComponent(d))
                )
                componentOrder.push(component)
            }
        })
    }     

    function compressJSSources(componentOrder) {
        return new Promise((resolve, reject) => {
            console.log("|- Compress JS sources")

            var jsSourceOrder = []
            componentOrder.forEach(c =>
                jsSourceOrder.push(c.filePath)
            )

            JSMinifier.minify(jsSourceOrder, { output: "./out/app.js" })

            resolve()
        })
    }

    function reallocateAndCompressAssets() {
            console.log("|- Reallocate and compress assets")
            return copy("./src/resources", "./out/resources", {
                        transform: (src, dest,  stats) => {
                            var extension = path.extname(src)
                            if (extension == ".json") {
                                return through((chunk, enc, done) => {
                                    var minifiedContent = JSON.minify(chunk.toString())
                                    done(null, minifiedContent)
                                })
                            } else {
                                return null
                            }
                        }})
                    .then(() => copy("./src/favicon.ico", "./out/favicon.ico"))
                    .then(() => copy("./lib", "./out/lib"))
    }

    function compressHTMLSources() {
        console.log("|- Compress HTML sources")
        return copy("./src/index.html", "./out/index.html", {
                    transform: (src, dest, stats) => {
                        return through((chunk, enc, done) => {
                            var minifiedContent = HTMLMinifier.minify(chunk.toString(), {
                                removeComments: true,
                                caseSensitive: true,
                                collapseWhitespace: true
                            })
                            done(null, minifiedContent);
                        })
                    }})
                .then(() => { return copy("./src/app", "./out/components", {
                                filter: /\w+\.html/,
                                rename: filePath => {
                                    var minifiedJSSources = fs.readFileSync("./out/app.js").toString()
                                    var fileName = path.basename(filePath)
                                    var originalFilePath = "src/app/" + filePath
                                    var correctedJSSources = minifiedJSSources.split(originalFilePath).join("components/" + fileName)
                    
                                    fs.writeFileSync("./out/app.js", correctedJSSources)
                                    return fileName
                                },
                                transform: (src, dest, stats) => {
                                    var srcFile = src
                                    var destFile = dest
                                    return through((chunk, enc, done) => {
                                        var minifiedContent = HTMLMinifier.minify(chunk.toString(), {
                                            removeComments: true,
                                            caseSensitive: true,
                                            collapseWhitespace: true
                                        })
                                        done(null, minifiedContent);
                                    })
                                }
                            })})
    }
    
})()
