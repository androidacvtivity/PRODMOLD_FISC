(function ($) {

    Drupal.behaviors.prodmolda = {
        attach: function (context, settings) {
            jQuery('#mywebform-content', context).on('input', '.input-restriction', function (e) {
                var $this = jQuery(this);
                var fieldName = $this.attr('field');
                var newVal = convertToNumber($this.val(), fieldName);
                $this.val(newVal);
            });

            function convertToNumber(value, fieldName) {
                var newVal = '';

                var decimalLength = 0;
                switch (Drupal.settings.mywebform.fields[fieldName].type) {
                    case 'float':
                        decimalLength = Drupal.settings.mywebform.fields[fieldName].decimal_length;
                        if (!decimalLength) {
                            decimalLength = 2;
                        }
                        break;
                    case 'money':
                        decimalLength = 2;
                        break;
                }

                var regExp;
                if (decimalLength) {
                    regExp = /[^\d\.]|^\./g;
                    value = value.replace(regExp, '');
                    var valSplitted = value.split('.');
                    newVal = valSplitted[0];
                    if (valSplitted.length > 1) {
                        newVal += '.' + valSplitted[1].substr(0, 1);
                    }
                } else {
                    regExp = /[^\d]/g;
                    newVal = value.replace(regExp, '');
                }

                return newVal;
            }
        }
    };

    function validatePositiveFields(field, ind) {
        var number, msg;
        if (Drupal.settings.mywebform.fields[field].grid_name == '') {
            number = Drupal.settings.mywebform.values[field];
            msg = Drupal.t('The specified number must be a positive.');
        } else {
            number = Drupal.settings.mywebform.values[field][ind];
            msg = Drupal.t('The number specified in line nr. @line must be a positive number.', {
                '@line': ind + 1
            });
        }

        if (number) {
            if (is_negative(number)) {
                webform.errors.push({
                    'fieldName': field,
                    'index': ind,
                    'msg': msg
                });
            }
        }
    }

    function validateDuplication(firstField, secondField, ind) {
        var firstVal = Drupal.settings.mywebform.values[firstField][ind];
        var secondVal = Drupal.settings.mywebform.values[secondField][ind];

        if (firstVal) {
            var search;
            var duplicated = false;
            var position = 0;
            while (search != -1) {
                search = Drupal.settings.mywebform.values[firstField].indexOf(firstVal, position);

                if (search != -1) {
                    position = parseInt(search) + 1;

                    if (search != ind && secondVal == Drupal.settings.mywebform.values[secondField][search]) {
                        duplicated = true;
                        break;
                    }
                }
            }

            if (duplicated) {
                webform.errors.push({
                    'fieldName': firstField,
                    'index': ind,
                    'msg': Drupal.t('Codul produsului din coloana B, si Codul din coloana C pentru rindurile @grid_number nu trebuie sa fie identice.', {
                        '@grid_number': ind + 1
                    })
                });

                webform.errors.push({
                    'fieldName': secondField,
                    'index': ind,
                    'msg': ''
                });
            }
        }
    }

    webform.validators.prodmolda = function (v, allowOverpass) {
        var webformErrors = [];
        var webformErrorMessages = '';
        var values = Drupal.settings.mywebform.values;
        var i, total, msg;
        var sumProdmold = 0;
        var error090012obj = [];

        var positiveFields = [
            'dec_table1_row_r10c1',
            'dec_table1_row_r10c2',
            'dec_table1_row_r10c3',
            'dec_table2_row_r200c2',
            'dec_table2_row_r100c2',
            'dec_table2_row_r200c6',
            'dec_table2_row_r200c8',
        ];

        for (i in positiveFields) {
            validatePositiveFields(positiveFields[i], 0);
        }

        total = values.dec_dinamicTable_row_c1.length;
        var firstCondition = false,
            secondConditionLength = 0,
            rowsWithCode2 = 0;
        for (i = 0; i < total; i++) {
            var rowWithoutError090012v2 = true,
                fieldName;

            for (var x in Drupal.settings.mywebform.grids.dinamicTable.fields) {
                fieldName = Drupal.settings.mywebform.grids.dinamicTable.fields[x];

                if (['numeric', 'float', 'money'].indexOf(Drupal.settings.mywebform.fields[fieldName].type) != -1) {
                    validatePositiveFields(fieldName, i);
                }
            }

            validateDuplication('dec_dinamicTable_row_cb', 'dec_dinamicTable_row_cc', i);

            if (toFloat(values.dec_dinamicTable_row_cc[i]) == 2) {
                rowsWithCode2++;
                if (toFloat(values.dec_dinamicTable_row_c2[i]) > 0 && !firstCondition) {
                    firstCondition = true;
                }

                if (toFloat(values.dec_dinamicTable_row_c2[i]) == 0) {
                    secondConditionLength++;
                }
            }

            if (toFloat(values.dec_dinamicTable_row_c5[i]) > 0 && toFloat(values.dec_dinamicTable_row_c6[i]) <= 0) {
                msg = Drupal.t('Cod eroare: 09-008-2. Cap PROD. pe PRODMOLD Col.6 > 0 (' + formatNumber(toFloat(values.dec_dinamicTable_row_c6[i]), 1) + ') , daca Col.5 > 0 (' + formatNumber(toFloat(values.dec_dinamicTable_row_c5[i]), 1) + ')') + '\n';
                webformErrorMessages += msg;
                webformErrors.push({
                    'fieldName': 'dec_dinamicTable_row_c6',
                    'index': i,
                    'msg': msg
                });
            } else if (toFloat(values.dec_dinamicTable_row_c6[i]) > 0 && toFloat(values.dec_dinamicTable_row_c5[i]) <= 0) {
                msg = Drupal.t('Cod eroare: 09-008-2. Cap PROD. pe PRODMOLD Col.5 > 0 (' + formatNumber(toFloat(values.dec_dinamicTable_row_c5[i]), 1) + ') , daca Col.6 > 0 (' + formatNumber(toFloat(values.dec_dinamicTable_row_c6[i]), 1) + ')') + '\n';
                webformErrorMessages += msg;
                webformErrors.push({
                    'fieldName': 'dec_dinamicTable_row_c5',
                    'index': i,
                    'msg': msg
                });
            }

            if (toFloat(values.dec_dinamicTable_row_c7[i]) > 0 && toFloat(values.dec_dinamicTable_row_c8[i]) <= 0) {
                msg = Drupal.t('Cod eroare: 09-009-2. Cap PROD. pe PRODMOLD Col.8 > 0 (' + formatNumber(toFloat(values.dec_dinamicTable_row_c8[i]), 1) + ') , daca Col.7 > 0 (' + formatNumber(toFloat(values.dec_dinamicTable_row_c7[i]), 1) + ')') + '\n';
                webformErrorMessages += msg;
                webformErrors.push({
                    'fieldName': 'dec_dinamicTable_row_c8',
                    'index': i,
                    'msg': msg
                });
            } else if (toFloat(values.dec_dinamicTable_row_c8[i]) > 0 && toFloat(values.dec_dinamicTable_row_c7[i]) <= 0) {
                msg = Drupal.t('Cod eroare: 09-009-2. Cap PROD. pe PRODMOLD Col.7 > 0 (' + formatNumber(toFloat(values.dec_dinamicTable_row_c7[i]), 1) + ') , daca Col.8 > 0 (' + formatNumber(toFloat(values.dec_dinamicTable_row_c8[i]), 1) + ')') + '\n';
                webformErrorMessages += msg;
                webformErrors.push({
                    'fieldName': 'dec_dinamicTable_row_c7',
                    'index': i,
                    'msg': msg
                });
            }

            var c10_check = toFloat(values.dec_dinamicTable_row_c1[i]) + toFloat(values.dec_dinamicTable_row_c2[i]) - toFloat(values.dec_dinamicTable_row_c4[i]) - toFloat(values.dec_dinamicTable_row_c5[i]) - toFloat(values.dec_dinamicTable_row_c7[i]) - toFloat(values.dec_dinamicTable_row_c9[i]);

            c10_check = (Math.round(c10_check * 100) / 100);

            if (toFloat(values.dec_dinamicTable_row_c10[i]) !== c10_check) {
                msg = Drupal.t('Cod eroare: 09-006-2. Cap PROD. - ' + values.dec_dinamicTable_row_ca[i] + ' Col.10 (' + values.dec_dinamicTable_row_c10[i] + ') = Col.1 + Col.2 - Col.4 - Col.5 - Col.7 - Col.9 (' + c10_check + ') , pentru fiecare PRODMOLD') + '\n';
                webformErrorMessages += msg;
                webformErrors.push({
                    'fieldName': 'dec_dinamicTable_row_c10',
                    'index': i,
                    'msg': msg
                });
            }

            var dinamicTableRow_c5_Rowc7 = (toFloat(values.dec_dinamicTable_row_c5[i]) + toFloat(values.dec_dinamicTable_row_c7[i]));
            dinamicTableRow_c5_Rowc7 = (Math.round(dinamicTableRow_c5_Rowc7 * 100) / 100);

            var sumC5C7 = (toFloat(values.dec_dinamicTable_row_c5[i]) + toFloat(values.dec_dinamicTable_row_c7[i]));
            sumC5C7 = (Math.round(sumC5C7 * 100) / 100);

            if (toFloat(values.dec_dinamicTable_row_c1[i]) === 0 && (toFloat(values.dec_dinamicTable_row_c2[i]) < sumC5C7)) {
                webform.errors.push({
                    'fieldName': 'dec_dinamicTable_row_c2',
                    'index': i,
                    'msg': Drupal.t('Cod eroare: 10-977. Cap PROD. Daca Cod. PRODMOLD - ' + values.dec_dinamicTable_row_ca[i] + ' Col 1=0, atunci Rind.PRODMOLD - ' + values.dec_dinamicTable_row_ca[i] + ' Col.2 (' + formatNumber(toFloat(values.dec_dinamicTable_row_c2[i]), 1) + ') >=(Col.5+ Col.7) (' + formatNumber(toFloat(dinamicTableRow_c5_Rowc7), 1) + ')')
                });
            }

            var valC2 = toFloat(values.dec_dinamicTable_row_c2[i]),
                valC4 = toFloat(values.dec_dinamicTable_row_c4[i]),
                valC5 = toFloat(values.dec_dinamicTable_row_c5[i]),
                valC6 = toFloat(values.dec_dinamicTable_row_c6[i]),
                valC7 = toFloat(values.dec_dinamicTable_row_c7[i]),
                valC8 = toFloat(values.dec_dinamicTable_row_c8[i]);

            if (valC5 + valC7 != 0) {
                sumProdmold += (valC2 - valC4) * ((valC6 + valC8) / (valC5 + valC7));
            }
        }

        var r100c2 = toFloat(values.dec_table2_row_r100c2);
        if (firstCondition && r100c2 <= 0) {
            webform.errors.push({
                'fieldName': 'dec_table2_row_r100c2',
                'msg': Drupal.t('Cod eroare: 09-001-2. Cap PROD. Daca sunt date pentru codul 2 PRODMOLD-ului atunci Col.2 Rind.100 > 0, ')
            });
        }

        if (rowsWithCode2 == secondConditionLength && r100c2 > 0) {
            webform.errors.push({
                'fieldName': 'dec_table2_row_r100c2',
                'msg': Drupal.t('Cod eroare: 09-001-2. Cap PROD. Col.2 Rind.100 > 0, daca sunt date pentru codul 2 PRODMOLD-ului')
            });
        }

        sumProdmold = formatNumber(sumProdmold, 1);

        var sumC1 = toFloat(sum(values.dec_dinamicTable_row_c1));
        sumC1 = (Math.round(sumC1 * 100) / 100);

        var sumC2 = toFloat(sum(values.dec_dinamicTable_row_c2));
        sumC2 = (Math.round(sumC2 * 100) / 100);

        var sumC6 = toFloat(sum(values.dec_dinamicTable_row_c6));
        sumC6 = (Math.round(sumC6 * 100) / 100);

        var sumC8 = toFloat(sum(values.dec_dinamicTable_row_c8));
        sumC8 = (Math.round(sumC8 * 100) / 100);

        var dec_table1_row_r10c1 = Number(values.dec_table1_row_r10c1);
        var dec_table1_row_r10c2 = Number(values.dec_table1_row_r10c2);
        var dec_table1_row_r10c3 = Number(values.dec_table1_row_r10c3);

        var dec_table2_row_r200c6 = Number(values.dec_table2_row_r200c6);

        if (toFloat(values.dec_table2_row_r200c6) != sumC6) {
            webform.errors.push({
                'fieldName': 'dec_table2_row_r200c6',
                'msg': Drupal.t('Cod eroare: 09-004-2. Cap PROD. Col.6 Rind.200 (' + formatNumber(toFloat(values.dec_table2_row_r200c6), 1) + ') = Suma Col.6 PRODMOLD (' + formatNumber(toFloat(sumC6), 1) + ')')
            });
        }

        if (toFloat(values.dec_table2_row_r200c8) != sumC8) {
            webform.errors.push({
                'fieldName': 'dec_table2_row_r200c8',
                'msg': Drupal.t('Cod eroare: 09-005-2. Cap PROD. Col.8 Rind.200 (' + formatNumber(toFloat(values.dec_table2_row_r200c8), 1) + ') = Suma Col.8 PRODMOLD (' + formatNumber(toFloat(sumC8), 1) + ')')
            });
        }

        var dec_fiscCod_caem = values.dec_fiscCod_caem;
        var sum_r10c2_r10c3 = Number(dec_table1_row_r10c2 + dec_table1_row_r10c3);
        sum_r10c2_r10c3 = (Math.round(sum_r10c2_r10c3 * 100) / 100);

        if (dec_fiscCod_caem.substring(0, 1) != 'B' && dec_fiscCod_caem.substring(0, 1) != 'C' && dec_fiscCod_caem.substring(0, 1) != 'D' && dec_fiscCod_caem.substring(0, 1) != 'E') {
            if (values.dec_table1_row_r10c1 != '' || values.dec_table1_row_r10c2 != '' || values.dec_table1_row_r10c3 != '') {
                if (values.dec_table1_row_r10c1 > 0) {
                    webform.errors.push({
                        'fieldName': 'dec_table1_row_r10c1',
                        'msg': Drupal.t('Cod eroare: 10-970. Cap CA se completeaza de intreprinderi cu CAEM: [B05 - E38]', {})
                    });
                }

                if (values.dec_table1_row_r10c2 > 0) {
                    webform.errors.push({
                        'fieldName': 'dec_table1_row_r10c2',
                        'msg': Drupal.t('Cod eroare: 10-970. Cap CA se completeaza de intreprinderi cu CAEM: [B05 - E38]', {})
                    });
                }

                if (values.dec_table1_row_r10c3 > 0) {
                    webform.errors.push({
                        'fieldName': 'dec_table1_row_r10c3',
                        'msg': Drupal.t('Cod eroare: 10-970. Cap CA se completeaza de intreprinderi cu CAEM: [B05 - E38]', {})
                    });
                }
            }
        } else {
            if (dec_table1_row_r10c1 !== sum_r10c2_r10c3) {
                webform.errors.push({
                    'fieldName': 'dec_table1_row_r10c1',
                    'msg': Drupal.t('Cod eroare: 10-971. Cap CA. Rind.10 Col.1 (' + formatNumber(toFloat(values.dec_table1_row_r10c1), 1) + ') = Rind.10 Col.2 + Rind.10 Col.3 (' + formatNumber(toFloat(sum_r10c2_r10c3), 1) + ')')
                });
            }

            if (values.dec_table1_row_r10c2 < toFloat(values.dec_table2_row_r200c6)) {
                webform.warnings.push({
                    'fieldName': 'dec_table1_row_r10c2',
                    'msg': Drupal.t('Cod eroare: 10-974. Cap CA. Rind.10 Col.2 (' + formatNumber(toFloat(values.dec_table1_row_r10c2), 1) + ') >= Cap PROD. Rind.200 Col.6 (' + formatNumber(toFloat(values.dec_table2_row_r200c6), 1) + ')')
                });
            }

            if (values.dec_table1_row_r10c3 < toFloat(values.dec_table2_row_r200c8)) {
                webform.warnings.push({
                    'fieldName': 'dec_table1_row_r10c3',
                    'msg': Drupal.t('Cod eroare: 10-975. Cap CA. Rind.10 Col.3 (' + formatNumber(toFloat(values.dec_table1_row_r10c3), 1) + ') >= Cap PROD. Rind.200 Col.8 (' + formatNumber(toFloat(values.dec_table2_row_r200c8), 1) + ')')
                });
            }

            var sum_r200c6_r200c8 = parseFloat(values.dec_table2_row_r200c6) + parseFloat(values.dec_table2_row_r200c8);
            if (toFloat(values.dec_table1_row_r10c1) < sum_r200c6_r200c8) {
                webform.warnings.push({
                    'fieldName': 'dec_table1_row_r10c1',
                    'msg': Drupal.t('Cod eroare: 10-973. Cap CA. Rind.10 Col.1 (' + formatNumber(toFloat(values.dec_table1_row_r10c1), 1) + ') >=Cap PROD. Rind.200 (Col.6+Col.8) (' + formatNumber(toFloat(sum_r200c6_r200c8), 1) + ')')
                });
            }
        }

        if (toFloat(values.dec_table2_row_r200c2) > 0 && sumC2 == 0) {
            webform.errors.push({
                'fieldName': 'dec_table2_row_r200c2',
                'msg': Drupal.t('Cod eroare: 09-017-2. Cap PROD. daca rindul 200 > 0 atunci PROD > 0')
            });
        } else if (sumC2 > 0 && toFloat(values.dec_table2_row_r200c2) == 0) {
            webform.errors.push({
                'fieldName': 'dec_table2_row_r200c2',
                'msg': Drupal.t('Cod eroare: 09-017-2. Cap PROD. daca PROD > 0 atunci rindul 200 > 0')
            });
        }

        var valR200C2 = formatNumber(toFloat(values.dec_table2_row_r200c2), 1);
        if (valR200C2 !== sumProdmold) {
            msg = Drupal.t('Cod eroare: 09-014-2. Cap PROD. Rind 200(col 2) (' + valR200C2 + ') = SUM( prodmold(col2-col4) * ( sum(col6+col8) / sum(col5+col7) )) (' + sumProdmold + ')') + '\n';
            webformErrorMessages += msg;
            webformErrors.push({
                'fieldName': 'dec_table2_row_r200c2',
                'index': 0,
                'msg': msg
            });
        }

        var sumR200C6C8 = (toFloat(values.dec_table2_row_r200c6) + toFloat(values.dec_table2_row_r200c8));
        sumR200C6C8 = (Math.round(sumR200C6C8 * 100) / 100);

        if (sumC1 === 0 && (toFloat(values.dec_table2_row_r200c2) < sumR200C6C8)) {
            webform.errors.push({
                'fieldName': 'dec_table2_row_r200c2',
                'msg': Drupal.t('Cod eroare: 10-976. Cap PROD. Daca Cod. PRODMOLD Col 1=0, atunci Rind.200 Col2 >=Rind 200(Col 6+ Col8)')
            });
        }

        if (webformErrorMessages !== '') {
            if (webform.prevalidate) {
                for (x in webformErrors) {
                    webformErrors[x].type = 'warning';
                    webform.errors.push(webformErrors[x]);
                }
            } else if (!mywebform_confirm(Drupal.t('The following inconsistencies were found:\n\n!messages\nWant to continue?', {
                '!messages': webformErrorMessages
            }))) {
                for (x in webformErrors) {
                    webformErrors[x].type = 'warning';
                    webform.errors.push(webformErrors[x]);
                }
            } else {
                for (x in webformErrors) {
                    webform.warnings.push(webformErrors[x]);
                }
            }
        }

        if (!values.dec_group2_adres) {
            webform.warnings.push({
                "fieldName": "dec_group2_adres",
                "msg": Drupal.t('Câmpul nu este completat')
            });
        }

        webform.validatorsStatus.prodmolda = 1;
        validateWebform();
    };
})(jQuery);

function changeInputClassificator(elem) {
    var inputVal = jQuery(elem).closest('tr').find('input.input-classificator');
    if (jQuery(elem).val() == inputVal.val())
        return;
    inputVal.val(jQuery(elem).val()).change();
    jQuery(elem).closest('tr').find('input.input-um').val(findPurpose(jQuery(elem).val())).change();
}

function changeSelectClassificator(elem) {
    var getValue = jQuery(elem).val();
    if (jQuery(elem).closest('tr').find('select.select-classificator option[value=' + getValue + ']').length > 0) {
        jQuery(elem).closest('tr').find('select.select-classificator').val(getValue).change();
        jQuery(elem).closest('tr').find('input.input-um').val(findPurpose(getValue)).change();
        return true;
    }
    mywebform_alert('Nu exista acest clasificator cu acest cod');
    return false;
}

function changeStatusCode(e) {
    if (jQuery.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
        (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
        (e.keyCode >= 35 && e.keyCode <= 40)) {
        return;
    }
    if ((e.shiftKey || (e.keyCode < 49 || e.keyCode > 50)) && (e.keyCode < 97 || e.keyCode > 98)) {
        e.preventDefault();
    }
}

function findPurpose(purposeName) {
    var count = Object.keys(prodmolda).length;

    for (var i = 0; i < count; i++) {
        if (parseInt(prodmolda['row_' + i].code) === parseInt(purposeName)) {
            return prodmolda['row_' + i].unitatea_mas;
        }
    }
    return null;
}
