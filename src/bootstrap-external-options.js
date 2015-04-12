angular.module('schemaForm')
  .config(['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
    function(schemaFormProvider, schemaFormDecoratorsProvider,  sfPathProvider) {
      var i,
          externalOptions
      ;

      externalOptions = function(name, schema, options) {
        var schema = schema || {};
        var stringType = (schema.type === 'string')? 'string': schema.type;
console.info("stringType1"+(typeof stringType));
console.info(stringType);
        if(typeof stringType === 'Array') {
console.info("stringType2");
console.info(stringType);
          stringType = !!schema.type.indexOf('string');
        };
console.info(stringType);

        if (stringType && schema.links && (typeof schema.links) === 'object') {
          for(i=0; i<schema.links.length; i++) {
            if(schema.links[i].rel === 'options') {
              var related = /({)([^}]*)(})/gm;
              var source = /{{([^}]*)}}/gm;
              var f = schemaFormProvider.stdFormObj(name, schema, options);
              f.key  = options.path;
              f.type = 'select-external';
              f.optionSource = schema.links[i].href.replace(related,'$1$1 model.$2 | _externalOptionUri $3$3');
              f.options = [];
              f.parameters = [];

              var matched = f.optionSource.match(source);

              while ((matched = source.exec(f.optionSource)) !== null) {
                f.parameters.push(matched);
              }
              options.lookup[sfPathProvider.stringify(options.path)] = f;
              return f;
            }
          }
        }
      };

      schemaFormProvider.defaults.string.unshift(externalOptions);

      //Add to the bootstrap directive
      schemaFormDecoratorsProvider.addMapping(
        'bootstrapDecorator',
        'select-external',
        'directives/decorators/bootstrap/external-options/external-options.html'
      );
      schemaFormDecoratorsProvider.createDirective(
        'select-external',
        'directives/decorators/bootstrap/external-options/external-options.html'
      );

    }
  ]);
