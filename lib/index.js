async function transferYamlJson(yamlDocument, region, appId) {
	class YamlTransferError extends Error {}

	const resource = yamlDocument.Resources
	appId = appId || 'test_app'
	if (!resource || Object.keys(resource).length === 0) {
		throw new YamlTransferError('resources/namespace expected')
	}
	const [namespace] = Object.keys(resource)

	if (Object.keys(resource[namespace]).length === 0) {
		throw new YamlTransferError('function info expected')
	}

	const [functionName] = Object.keys(resource[namespace]).filter(
		(key) => key !== 'Type'
	)
	const functionInfo = resource[namespace][functionName].Properties

	if (!region) {
		throw new Error('请选择地域')
	}

	const slsYamlJson = {
		component: 'scf',
		name: `${region}_${namespace}_${functionName}`,
		org: `${appId}`,
		app: functionName,
		stage: 'dev',
	}

	// 必填参数
	const slsDocument = {}
	slsDocument.name = functionName
	slsDocument.src = functionInfo.CodeUri
	slsDocument.description = functionInfo.Description
	slsDocument.handler = functionInfo.Handler
	slsDocument.runtime = functionInfo.Runtime
	slsDocument.namespace = namespace
	slsDocument.region = region

	// 非必填
	functionInfo.MemorySize &&
		(slsDocument.memorySize = functionInfo.MemorySize)
	functionInfo.Timeout && (slsDocument.timeout = functionInfo.Timeout)
	functionInfo.Role && (slsDocument.role = functionInfo.Role)

	if (
		functionInfo.VpcConfig &&
		functionInfo.VpcConfig.VpcId &&
		functionInfo.VpcConfig.SubnetId
	) {
		slsDocument.vpcConfig = {
			vpcId: functionInfo.VpcConfig.VpcId,
			subnetId: functionInfo.VpcConfig.SubnetId,
		}
	}

	if (
		functionInfo.Environment &&
		functionInfo.Environment.Variables &&
		Object.keys(functionInfo.Environment.Variables).length > 0
	) {
		const envObject = functionInfo.Environment.Variables
		slsDocument.environment = {
			variables: {},
		}
		Object.keys(envObject).forEach((envKey) => {
			slsDocument.environment.variables[envKey] = envObject[envKey]
		})
	}

	const eventTypeMap = {
		CMQ: 'cmq',
		CKafka: 'ckafka',
		APIGW: 'apigw',
		COS: 'cos',
		Timer: 'timer',
	}

	if (functionInfo.Events && Object.keys(functionInfo.Events).length > 0) {
		slsDocument.events = []
		Object.keys(functionInfo.Events).forEach((eventKey) => {
			const type = eventTypeMap[functionInfo.Events[eventKey].Type]
			if (!type) {
				throw new YamlTransferError(
					`unknown event type: ${functionInfo.Events[eventKey].Type}`
				)
			}
			const sourceObjectProperties =
				functionInfo.Events[eventKey].Properties
			const eventObject = {}
			eventObject[type] = {
				name: eventKey,
				parameters: {},
			}

			switch (type) {
				case 'cmq':
					eventObject[type].parameters = {
						name: sourceObjectProperties.Name,
						enable: sourceObjectProperties.Enable,
					}
					removeUndefined(eventObject[type].parameters)
					break
				case 'ckafka':
					eventObject[type].parameters = {
						name: sourceObjectProperties.Name,
						topic: sourceObjectProperties.Topic,
						maxMsgNum: sourceObjectProperties.MaxMsgNum,
						offset: sourceObjectProperties.Offset,
						enable: sourceObjectProperties.Enable,
					}
					removeUndefined(eventObject[type].parameters)
					break
				case 'apigw':
					eventObject[type].parameters = {
						serviceId: sourceObjectProperties.ServiceId,
						environment: sourceObjectProperties.StageName,
						protocols: ['http', 'https'],
						endpoints: [
							{
								path: `/${functionName}`,
								method:
									sourceObjectProperties.HttpMethod || 'ANY',
								function: {
									isIntegratedResponse:
										sourceObjectProperties.IntegratedResponse ||
										false,
								},
							},
						],
					}
					removeUndefined(eventObject[type].parameters)
					break
				case 'cos':
					eventObject[type].parameters = {
						bucket: sourceObjectProperties.Bucket,
						events: sourceObjectProperties.Events,
						enable: sourceObjectProperties.Enable,
					}
					if (sourceObjectProperties.Filter) {
						eventObject[type].parameters.filter = {
							prefix: sourceObjectProperties.Filter.Prefix || '',
							suffix: sourceObjectProperties.Filter.Suffix || '',
						}
					}
					removeUndefined(eventObject[type].parameters)
					break
				case 'timer':
					eventObject[type].parameters = {
						cronExpression: sourceObjectProperties.CronExpression,
						message: sourceObjectProperties.Message,
						enable: sourceObjectProperties.Enable,
					}
					removeUndefined(eventObject[type].parameters)
					break
			}

			slsDocument.events.push(eventObject)
		})
	}
	slsYamlJson.inputs = slsDocument
	return slsYamlJson
}

function removeUndefined(obj) {
	Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key])
	return obj
}

module.exports = {
	transferYamlJson,
}
