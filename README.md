Angular Schema Form External Options
====================================
**TODO Update: 2015-05-12** I have only one issue remaining where blank options are being added to the drop down, any help in solving that would be appreciated given my limited time.

This is an add-on for [Angular Schema Form](https://github.com/Textalk/angular-schema-form/).

Ever wanted to load select options dynamically based on other fields in your Angular Schema Form?

The external options add-on can do that for your form and still maintain valid JSON Schema compliance.

**It can now also load options from the schema form scope.**

Installation
------------
The external options plugin is an add-on to the Bootstrap decorator so far. To use it, just include
`bootstrap-external-options.min.js` *after* `bootstrap-decorator.min.js`.

Usage
-----
The external options add-on adds a new default mapping.

| Format Type         |   Becomes            |
|:--------------------|:--------------------:|
| "select-external"   |   A select drop down that loads options from an external URI |

To load data from an external source the type must be string and the links[].rel value must be set to 'options'

| Schema                                          |   Default Form type  |
|:------------------------------------------------|:--------------------:|
| "type": "string" and "links[].rel": "options"   |   select-external    |

To use data in the schema form scope set optionData to the variable you wish to use.

| Schema             |   Form type          |   Form value    |
|:-------------------|:--------------------:|:---------------:|
| "type": "string"   |   select-external    |   optionData    |


Filtering URI
-----------------

To add a filter to pass over the URI just add a filter called **externalOptionUri**
```javascript
.filter('externalOptionUri', function() {
  function externalOptionUriFilter(input){
    var current = input;
    if(typeof current === 'string') {
      current = current.replace(' ','-').toLowerCase();
    }
    return current;
  }

  return externalOptionUriFilter;
})
```

Examples
-----------------
Below is an example. The variables use model.variable at the moment, considering changing that in v2 if I can find an easy way to handle it without that I am happy with.

**Remote Data**
```javascript
{
  "type": "object",
  "properties": {
    "state": {
      "title":"State",
      "type": "string"
    },
    "city": {
      "title":"City",
      "type": "string"
    },
    "suburb": {
      "title": "Suburb",
      "type": "string",
      "links":[
        { "rel":'options', "href":'./data/{state}/{city}/suburb.json' }
      ]
    }
  }
}
```

**Local Data** must be an array of strings for now.

Within the schema form controller:

```javascript
  $scope.cities = [ 'Melbourne', 'Toronto', 'London' ]
```
Within the form definition:
```javascript
  {
    "key": "city",
    "type": "select-external",
    "optionData": "cities"
  },
```

**Remotely** loaded data must be in one of the following two formats:

**enum**
```javascript
{
  "title":"Suburb",
  "description":"Suburbs for Melbourne, Victoria",
  "enum":[ "Hawthorn", "Melbourne", "Richmond" ]
}
```
**titleMap**
```javascript
{
  "title":"Suburb",
  "description":"Suburbs for Melbourne, Victoria",
  "titleMap":[
    {"name": "Hawthorn",  "value": "Hawthorn"},
    {"name": "Melbourne", "value": "Melbourne"},
    ...
    {"name": "Richmond",  "value": "Richmond"}
  ]
}
```

Building
-----------------

```bash
$ npm install
$ npm run build
```
