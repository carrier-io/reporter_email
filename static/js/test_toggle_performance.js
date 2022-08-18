const EmailRecipient = {
    props: ['email', 'index'],
    emits: ['remove'],
    delimiters: ['[[', ']]'],
    template: `
        <li class="list-group-item d-inline-flex justify-content-between p-1">
            <h13>[[ email ]]</h13>
            <button
                type="button"
                class="btn btn-action btn-24"
                title="remove"
                @click.prevent="remove"
            >
                <i class="fa fa-times"></i>
            </button>
        </li>
    `,
    methods: {
        remove() {
            this.$emit('remove', this.index)
        }
    }
}

const EmailIntegration = {
    delimiters: ['[[', ']]'],
    components: {
        EmailRecipient
    },
    props: ['instance_name', 'section', 'selected_integration', 'is_selected'],
    emits: ['set_data', 'clear_data'],
    data() {
        return this.initialState()
    },
    computed: {
        hasErrors() {
            return this.errors.length + this.warnings.length > 0
        },
    },
    methods: {
        get_data() {
            if (this.is_selected) {
                const {selected_integration: id, recipients, error_rate, performance_degradation_rate, missed_thresholds} = this
                return {id, recipients, error_rate, performance_degradation_rate, missed_thresholds}
            }
        },
        set_data(data) {
            const {id, recipients, error_rate, performance_degradation_rate, missed_thresholds} = data
            this.recipients = recipients
            this.error_rate = error_rate
            this.performance_degradation_rate = performance_degradation_rate
            this.missed_thresholds = missed_thresholds
            this.$emit('set_data', {id})
        },
        clear_data() {
            Object.assign(this.$data, this.initialState())
            this.$emit('clear_data')
        },
        add(email) {
            if (email === '') return;
            if (!this.validateEmail(email)) {
                this.errors.push(`Email ${email} is invalid`)
                return;
            }
            if (!this.validateUniqueness(email)) {
                this.warnings.push(`Email ${email} is already added`)
                return;
            }
            this.recipients.push(email);
        },
        handleAdd() {
            this.errors = []
            this.warnings = []
            this.email.split(',').forEach(i => {
                this.add(i.trim().toLowerCase())
            })
            if (!this.hasErrors) {
                this.email = ''
            }
            this.errors.length > 0 && alertCreateTest.add(`${this.errors.length} errors occurred while adding emails`, 'danger-overlay')
            this.warnings.length > 0 && alertCreateTest.add(`${this.warnings.length} warnings while adding emails`, 'warning-overlay')
        },
        validateUniqueness(email) {
            return this.recipients.find(e => e.toLowerCase() === email.toLowerCase()) === undefined
        },
        validateEmail(email) {
            return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
        },
        removeIndex(index) {
            this.recipients.splice(index, 1)
        },

        initialState: () => ({
            email: '',
            recipients: [],
            errors: [],
            warnings: [],
            error_rate: 10,
            performance_degradation_rate: 20,
            missed_thresholds: 50,
        })
    },
    template: `
        <div class="mt-3">
            <div class="d-flex">
                <label class="col-6 pl-0">
                    <h9>Error rate</h9>
                    <input type="number" class="form-control" 
                        placeholder="Optional. Default: 10"
                        v-model="error_rate"
                    >
                </label>
                <label class="col-6 pr-0">
                    <h9>Degradation rate</h9>
                    <input type="number" class="form-control" 
                        placeholder="Optional. Default: 20"
                        v-model="performance_degradation_rate"
                    >  
                </label>
            </div>
            <div class="d-flex">
                <label class="col-12 p-0">
                    <h9>Missed Thresholds</h9>
                    <input type="number" class="form-control" 
                        placeholder="Optional. Default: 50"
                        v-model="missed_thresholds"
                    >
                </label>
            </div>
            <div class="mt-3">
            <h9>Recipients</h9>
            <div class="input-group">
                <input type="email" class="form-control" placeholder="Recipients' emails comma-separated"
                       v-model="email"
                       :class="{ 'is-invalid': hasErrors }"
                >
                <div class="input-group-append">
                    <button class="btn btn-secondary btn-37" type="button"
                            style="max-width: unset"
                            @click="handleAdd"
                            :disabled="email === ''"
                            :class="{ 'btn-danger': hasErrors }"
                    >
                        Add
                    </button>
                </div>
    
            </div>
            <div class="invalid-feedback"
                 style="display: block"
                 v-if="hasErrors"
            >
                <div v-for="error in errors">
                    [[ error ]]
                </div>
                <div v-for="warning in warnings" class="text-warning">
                    [[ warning ]]
                </div>
            </div>
            <ul class="list-group mt-1 list-group-flush">
                <EmailRecipient
                        v-for="(item, index) in recipients"
                        :key="index"
                        :index="index"
                        :email="item"
                        @remove="removeIndex"
                ></EmailRecipient>
            </ul>
            </div>
        </div>
    `
}

register_component('reporter-email', EmailIntegration)