angular.module('schemaForm')
  .config(['schemaFormProvider', 'sfPathProvider', function(schemaFormProvider,  sfPathProvider) {
    var i,
        externalOptions
    ;

    externalOptions = function(name, schema, options) {
      if (schema.type === 'string' && schema.links && (typeof schema.links) === 'object') {
        for(i=0; i<schema.links.length; i++) {
          if(schema.links[i].rel === 'options') {
            var related = /({)([^}]*)(})/gm;
            var source = /{{([^}]*)}}/gm;
            var f = schemaFormProvider.stdFormObj(name, schema, options);
            f.key  = options.path;
            f.type = 'select-external';
            f.optionSource = schema.links[i].href.replace(related,'$1$1$2$3$3');
            f.options = [];
            f.parameters = [];


            var matched = f.optionSource.match(source);

            while ((matched = source.exec(f.optionSource)) !== null)
            {
              f.parameters.push(matched);
            }
            options.lookup[sfPathProvider.stringify(options.path)] = f;
            return f;
          }
        }
      }
    };

    schemaFormProvider.defaults.string.unshift(externalOptions);
  }]);
