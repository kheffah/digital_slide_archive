/* globals girder */

/**
 * Show the Digital Slide Archive config settings.  This includes the TCGA
 * Ingest settings (which is really an ingest control).
 */
girder.views.digitalSlideArchive_ConfigView = girder.View.extend({
    events: {
        'submit #g-dsa-form': function (event) {
            event.preventDefault();
            this.$('#g-dsa-error-message').empty();
            this._saveSettings([{
                key: 'digital_slide_archive.brand_name',
                value: this.$('#g-dsa-brand_name').val()
            }]);
        },
        'click .g-plugin-restart-button': function () {
            var params = {
                text: 'Are you sure you want to restart the server?  This ' +
                      'will interrupt all running tasks for all users.',
                yesText: 'Restart',
                confirmCallback: girder.restartServer
            };
            girder.confirm(params);
        },
        'submit #g-tcga-ingest-form': function (event) {
            event.preventDefault();

            var assetstoreId = this.$('#g-tcga-ingest-assetstore-id').val().trim(),
                srcPath = this.$('#g-tcga-ingest-path').val().trim(),
                count = this.$('#g-tcga-ingest-amount').val();
            this.$('.g-validation-failed-message').empty();
            this._ingest({
                dataset: 'tcga',
                path: srcPath,
                progress: 'true',
                assetstoreId: assetstoreId,
                count: count
            });
        }
    },

    initialize: function () {
        girder.restRequest({
            type: 'GET',
            path: 'system/setting',
            data: {
                list: JSON.stringify(['digital_slide_archive.brand_name'])
            }
        }).done(_.bind(function (resp) {
            this.settings = resp;
            this.render();
        }, this));
    },

    render: function () {
        this.$el.html(girder.templates.digitalSlideArchiveConfig({
            brand_name: this.settings['digital_slide_archive.brand_name'] || ''
        }));
        if (!this.breadcrumb) {
            this.breadcrumb = new girder.views.PluginConfigBreadcrumbWidget({
                pluginName: 'Digital Slide Archive',
                el: this.$('.g-config-breadcrumb-container'),
                parentView: this
            }).render();
        }

        return this;
    },

    _saveSettings: function (settings) {
        girder.restRequest({
            type: 'PUT',
            path: 'system/setting',
            data: {
                list: JSON.stringify(settings)
            },
            error: null
        }).done(_.bind(function () {
            girder.events.trigger('g:alert', {
                icon: 'ok',
                text: 'Settings saved.',
                type: 'success',
                timeout: 4000
            });
            girder.pluginsChanged = true;
            $('.g-plugin-restart').addClass('g-plugin-restart-show');
        }, this)).error(_.bind(function (resp) {
            this.$('#g-dsa-error-message').text(
                resp.responseJSON.message
            );
        }, this));
    },

    _ingest: function (params) {
        girder.restRequest({
            type: 'POST',
            path: 'system/ingest',
            data: params,
            error: null
        }).done(_.bind(function () {
            girder.events.trigger('g:alert', {
                icon: 'ok',
                text: 'Ingest started.',
                type: 'success',
                timeout: 4000
            });
        }, this)).error(_.bind(function (resp) {
            this.$('#g-tcga-ingest-error-message').text(
                resp.responseJSON.message
            );
        }, this));
    }
});

girder.router.route(
    'plugins/digital_slide_archive/config', 'digitalSlideArchiveConfig',
    function () {
        girder.events.trigger('g:navigateTo',
                              girder.views.digitalSlideArchive_ConfigView);
    });

girder.exposePluginConfig(
    'digital_slide_archive', 'plugins/digital_slide_archive/config');
