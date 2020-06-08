## template.yaml转换工具
把SCF CLI使用的template.yaml转换为serverless framework使用的serverless.yaml

## 用法
``` bash
npx scf-yaml-transformer															#在当前目录查找template.yaml，转换成serverless.yaml并存在当前目录
npx scf-yaml-transformer /path/to/your/template.yaml ./								#把/path/to/your/template.yaml，转换成serverless.yaml并存在./
npx scf-yaml-transformer /path/to/your/template.yaml ./ ap-guangzhou				#把/path/to/your/template.yaml，转换成serverless.yaml并存在./，并定义region到广州
npx scf-yaml-transformer /path/to/your/template.yaml ./ ap-guangzhou 1233453456 	#把/path/to/your/template.yaml，转换成serverless.yaml并存在./，并定义region到广州，并定义APPID为1233453456
```