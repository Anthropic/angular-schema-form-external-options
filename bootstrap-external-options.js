angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/external-options/external-options.html","<div class=\"form-group\" ng-class=\"{\'has-error\': hasError(), \'has-success\': hasSuccess(), \'has-feedback\': form.feedback !== false, \'float\': form.float === true }\">\r\n  <label class=\"control-label\" ng-show=\"showTitle()\">\r\n    {{form.title}}\r\n  </label><select ng-model=\"form.selectedOption\"\r\n          ng-model-options=\"form.ngModelOptions\"\r\n          ng-disabled=\"form.readonly\"\r\n          sf-changed=\"form\"\r\n          ng-change=\"changed()\"\r\n          class=\"form-control\"\r\n          schema-validate=\"form\"\r\n          external-options\r\n          links=\"form.schema.links\"\r\n          model=\"model\"\r\n          form=\"form\"\r\n          ng-options=\"item.value as item.name for item in form.options\">\r\n          <option ng-show=\"form.selectedOption\" value=\"\"></option>\r\n  </select>\r\n  <div class=\"help-block\"\r\n       ng-show=\"(hasError() && errorMessage(schemaError()))\"\r\n       ng-bind-html=\"(hasError() && errorMessage(schemaError()))\"></div>\r\n</div>\r\n");}]);
angular.module('schemaForm').directive('externalOptions', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      form: '=',
      model: '='
    },
    controller:['$scope','$http','$interpolate','sfSelect', function($scope, $http, $interpolate, sfSelect){
      var i,
          scope = $scope
      ;
      scope.form.options = [];
      scope.currentSource = '';
      scope.externalOptions = {};

      var processOptions = function(optionSource, data, current) {
        var enumTitleMap = [];

        if(data.enum && data.enum.length){
          for(i=0; i<data.enum.length; i++) {
            if(data.enum[i] && data.enum[i].length) {
              enumTitleMap.push({name:data.enum[i],value:data.enum[i]});
            };
          };
          //enumTitleMap.unshift({name:'-- Select --',value:''});
          scope.form.options = enumTitleMap;
        }
        else if(data.titleMap) {
          scope.form.options = data.titleMap;
        };

        if(scope.externalOptions[optionSource] !== data) {
          scope.externalOptions[optionSource] = data;
        };

        scope.$watch('form.selectedOption', function(newValue, oldValue) {
          sfSelect(scope.form.key, scope.model, scope.form.selectedOption);
        });

        // determine if the new options contain the old one
        for(var i=0; i<scope.form.options.length; i++) {
          if(typeof scope.form.options[i].value !== 'undefined' && current === scope.form.options[i].value) {
            scope.form.selectedOption = scope.form.options[i].value;
            return;
          }
        };

        sfSelect(scope.form.key, scope.model, '');
        return;
      }

      var loadOptions = function(optionSource, newValue){
        if(scope.currentSource === optionSource && (typeof scope.externalOptions[optionSource] === 'object')) {
          return;
        }
        else {
          scope.currentSource = optionSource;
        };

        var current = sfSelect(scope.form.key, scope.model);
        current = (current)? current: undefined;

        if(typeof scope.externalOptions[optionSource] === 'object') {
          processOptions(optionSource, scope.externalOptions[optionSource], current);
          return;
        };

        $http.get(optionSource,{responseType:"json"})
          .success(function(data, status){
            processOptions(optionSource, data, current);
          })
          .error(function(data, status){
            scope.form.options = [];
            scope.form.selectedOption = '';
            sfSelect(scope.form.key, scope.model, scope.form.selectedOption);
          });
      };
      if (scope.form.parameters.length) {
        for(var i=0; i<scope.form.parameters.length; i++) {
          if (angular.isDefined(scope.form.parameters[i])) {
            scope.$watch(scope.form.parameters[i][1], function(newValue, oldValue) {
              var exp, optionSource;
              if (newValue) {
                exp = $interpolate(scope.form.optionSource, false, null, true);
                optionSource = exp(scope);
                loadOptions(optionSource, scope.form.key);
              }
              else {
                scope.form.options = [];
              };
            });
          };
        };
      }
      else {
        loadOptions(scope.form.optionSource);
      };
    }]
  };
})
.filter('_externalOptionUri', ['$filter', function($filter) {
  function _externalOptionUriFilter(input) {
    if($filter('externalOptionUri')) {
      input = $filter('externalOptionUri')(input);
    };
    return input;
  }

  return _externalOptionUriFilter;
}]);
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
  }]);
