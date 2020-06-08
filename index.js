const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')
const {transferYamlJson} = require('./lib/index')

const cwd = process.cwd()

let from = process.argv[2] || './template.yaml'
let to = process.argv[3] || './'
let region = process.argv[4] || 'ap-guangzhou'
let appId = process.argv[5] || 'app'

if(from.indexOf('./') === 0 || from.indexOf('../') === 0){
	from = path.resolve(cwd,from)
}
if(to.indexOf('./') === 0 || to.indexOf('../') === 0){
	to = path.resolve(cwd,to)
}

to = path.resolve(to,'serverless.yaml')

if(!fs.existsSync(from)){
	throw new Error(`load template.yaml from ${from} failed, file not found`)
}

const yamlDocument = yaml.safeLoad(fs.readFileSync(from).toString())

;(async()=>{
	console.log(require('./lib/index'))
	const json = await transferYamlJson(yamlDocument,region,appId)
	fs.writeFileSync(to,yaml.safeDump(json))
})()