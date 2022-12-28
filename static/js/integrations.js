const EmailIntegrationModal = {
    delimiters: ['[[', ']]'],
    props: ['instance_name', 'display_name', 'default_template', 'logo_src', 'section_name'],
    emits: ['update'],
    components: {
        SecretFieldInput: SecretFieldInput
    },
    template: `
<div
        :id="modal_id"
        class="modal modal-small fixed-left fade shadow-sm" tabindex="-1" role="dialog"
        @dragover.prevent="modal_style = {'height': '300px', 'border': '2px dashed var(--basic)'}"
        @drop.prevent="modal_style = {'height': '100px', 'border': ''}"
>
    <ModalDialog
            v-model:description="description"
            v-model:is_default="is_default"
            @update="update"
            @create="create"
            :display_name="display_name"
            :id="id"
            :is_fetching="is_fetching"
            :is_default="is_default"
    >
        <template #body>
            <div class="form-group">
                <div class="d-flex">
                    <div class="col-8 p-0 mr-1">
                        <p class="font-h5 font-semibold">Host</p>
                        <input type="text" v-model="host" class="form-control form-control-alternative"
                               placeholder="SMTP host"
                               :class="{ 'is-invalid': error.host }">
                        <div class="invalid-feedback">[[ error.host ]]</div>
                    </div>
                    
                    <div class="col">
                       <p class="font-h5 font-semibold">Port</p>
                        <input type="number" class="form-control form-control-alternative" placeholder="SMTP port"
                               v-model="port"
                               :class="{ 'is-invalid': error.port }"
                        >
                        <div class="invalid-feedback">[[ error.port ]]</div>
                    </div>
                </div>
                
        
                <div>
                    <p class="font-h5 font-semibold">User</p>
                    <input type="text" class="form-control form-control-alternative"
                           v-model="user"
                           placeholder="SMTP user"
                           :class="{ 'is-invalid': error.user }">
                    <div class="invalid-feedback">[[ error.user ]]</div>
                </div>
                <div>
                    <p class="font-h5 font-semibold">Password</p>
                    <SecretFieldInput
                        v-model="passwd"
                        placeholder="SMTP password"
                    />
                    <div v-show="error.passwd" class="invalid-feedback" style="display: block">[[ error.passwd ]]</div>
                </div>
                
                <p class="font-h5 font-semibold">Sender</p>
                <p>
                    <h13>Optional. By default emails are sent from SMTP user</h13>
                </p>
                <input type="text" class="form-control form-control-alternative"
                       v-model="sender"
                       placeholder="Email sender"
                       :class="{ 'is-invalid': error.sender }">
                <div class="invalid-feedback">[[ error.sender ]]</div>
                <p class="font-h5 font-semibold">Email template</p>
                <p>
                    <h13>You may edit template or upload new one instead</h13>
                </p>
                <div class="form-group">

                    <p v-if="fileName">
                        <h13>[[ fileName ]] preview:</h13>
                    </p>
                    <textarea class="form-control" rows="3"
                              v-model="template"
                              @drop.prevent="handleDrop"
                              :style="modal_style"
                    ></textarea>
                    <label class="mt-1">
                        <span class="btn btn-secondary btn-sm mr-1 d-inline-block">Upload template</span>
                        <h13>Or drag and drop .html file in the template area</h13>
                        <input type="file" accept="text/html" class="form-control form-control-alternative"
                               style="display: none"
                               @change="handleInputFile"
                               :class="{ 'is-invalid': error.template }"
                        >
                    </label>

                    <div class="invalid-feedback">[[ error.template ]]</div>
                </div>
            </div>
        </template>
        <template #footer>
            <test-connection-button
                    :apiPath="api_base + 'check_settings/' + pluginName"
                    :error="error.check_connection"
                    :body_data="body_data"
                    v-model:is_fetching="is_fetching"
                    @handleError="handleError"
            >
            </test-connection-button>
        </template>

    </ModalDialog>
</div>
    `,
    data() {
        return this.initialState()
    },
    mounted() {
        this.modal.on('hidden.bs.modal', e => {
            this.clear()
        })
    },
    computed: {
        apiPath() {
            return this.api_base + 'integration/'
        },
        project_id() {
            // return getSelectedProjectId()
            return this.$root.project_id
        },
        body_data() {
            const {
                host,
                port,
                user,
                passwd,
                sender,
                description,
                is_default,
                project_id,
                base64Template: template
            } = this
            return {host, port, user, passwd, sender, description, is_default, project_id, template}
        },
        base64Template() {
            return btoa(this.template)
        },
        modal() {
            return $(this.$el)
        },
        modal_id() {
            return `${this.instance_name}_integration`
        }
    },
    methods: {
        clear() {
            Object.assign(this.$data, this.initialState())
        },
        load(stateData) {
            Object.assign(this.$data, stateData, {
                template: this.loadBase64(stateData.template)
            })
        },
        handleEdit(data) {
            const {description, is_default, id, settings} = data
            this.load({...settings, description, is_default, id})
            this.modal.modal('show')
        },
        handleDelete(id) {
            this.load({id})
            this.delete()
        },
        handleError(error_data) {
            error_data.forEach(item => {
                this.error = {[item.loc[0]]: item.msg}
            })
        },
        async create() {
            this.is_fetching = true
            try {
                const resp = await fetch(this.apiPath + this.pluginName, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(this.body_data)
                })
                if (resp.ok) {
                    this.modal.modal('hide')
                    // location.reload()
                    // alertMain.add('Email reporter created!', 'success-overlay')
                    // setTimeout(() => location.reload(), 1500)
                    this.$emit('update', {...this.$data, section_name: this.section_name})
                    // showNotify('SUCCESS', 'Created')
                } else {
                    const error_data = await resp.json()
                    this.handleError(error_data)
                }
            } catch (e) {
                console.error(e)
                showNotify('ERROR', 'Error creating reporter email')
            } finally {
                // setTimeout(() => {
                this.is_fetching = false
                // }, 2000)
            }
        },
        async update() {
            this.is_fetching = true
            try {
                const resp = await fetch(this.apiPath + this.id, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(this.body_data)
                })
                if (resp.ok) {
                    this.modal.modal('hide')
                    // location.reload()
                    this.$emit('update', {...this.$data, section_name: this.section_name})
                    // alertMain.add('Email reporter updated!', 'success-overlay')
                    // setTimeout(() => location.reload(), 1500)
                } else {
                    const error_data = await resp.json()
                    this.handleError(error_data)
                }
            } catch (e) {
                console.error(e)
                showNotify('ERROR', 'Error updating reporter email')
            } finally {
                this.is_fetching = false
            }
        },
        async delete() {
            this.is_fetching = true
            try {
                const resp = await fetch(this.apiPath + this.id, {
                    method: 'DELETE',
                })
                if (resp.ok) {
                    // location.reload()
                    // alertMain.add('Email integration deleted')
                    // setTimeout(() => location.reload(), 1000)
                    this.$emit('update', {...this.$data, section_name: this.section_name})
                } else {
                    const error_data = await resp.json()
                    this.handleError(error_data)
                    alertMain.add(`
                        Deletion error. 
                        <button class="btn btn-primary" 
                            @click="registered_components?.${this.instance_name}?.modal.modal('show')"
                        >
                            Open modal
                        <button>
                    `)
                }
            } catch (e) {
                console.error(e)
                showNotify('ERROR', 'Error deleting reporter email')
            } finally {
                this.is_fetching = false
            }
        },

        loadBase64(b64text) {
            if (!b64text) return ''
            try {
                return atob(b64text)
            } catch (e) {
                console.error(e)
                this.error.template = 'Only files of data:text/html;base64 are supported'
                this.template = ''
                this.fileName = ''
                return ''
            }
        },
        handleFileUpload(file) {
            let reader = new FileReader()
            reader.onload = (evt) => {
                this.template = this.loadBase64(evt.target.result.split('data:text/html;base64,')[1])
            }
            reader.onerror = (e) => {
                this.error.template = 'error reading file'
                this.template = ''
                this.fileName = ''
            }
            delete this.error.template
            this.fileName = file.name
            reader.readAsDataURL(file)
        },
        handleDrop(e) {
            const file = e.dataTransfer.files[0]
            file && this.handleFileUpload(file)
        },
        handleInputFile(event) {
            const input = event.target
            if (input.files && input.files[0]) {
                this.handleFileUpload(input.files[0])
            }
        },

        initialState: () => ({
            modal_style: {'height': '100px', 'border': ''},
            host: '',
            port: null,
            user: '',
            passwd: {
                value: '',
                from_secrets: false
            },
            sender: '',
            description: '',
            is_default: false,
            is_fetching: false,
            error: {},
            id: null,
            template: '',
            fileName: '',
            pluginName: 'reporter_email',

            api_base: '/api/v1/integrations/',
        })
    }
}

register_component('EmailIntegrationModal', EmailIntegrationModal)
