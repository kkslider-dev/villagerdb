import React from "react";
import ReactDOM from "react-dom"
import $ from 'jquery'

import Paginator from './paginator.js';
import SearchResults from './search-results.js';
import Loader from './loader.js';
import FilterList from './filter-list.js';

/**
 *
 */
class Browser extends React.Component {
    /**
     *
     * @param props
     */
    constructor(props) {
        super(props);

        // Initialize state.
        this.state = JSON.parse(this.props.initialState);

        // Bindings
        this.setPage = this.setPage.bind(this);
        this.setAppliedFilters = this.setAppliedFilters.bind(this);
    }

    componentDidMount() {
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                console.log(event.state);
                this.setState(event.state);
            } else {
                this.setState(JSON.parse(this.props.initialState));
            }
        });
    }
    /**
     *
     * @returns {*}
     */
    render() {
        // Error case.
        if (this.state.error) {
            return (
                <p className="p-3 mb-2 bg-danger text-white">
                    We're having some trouble. Try refreshing the page.
                </p>
            );
        }
        // No results case.
        if (this.state.results.length === 0) {
            return (
                <p>There were no results for your search.</p>
            );
        }

        // Show loader?
        let loader = null;
        if (this.state.isLoading) {
            loader = (
                <Loader/>
            );
        }

        return (
            <div id={this.props.id}>
                <div className="row">
                    <div className="col-12 col-md-2">
                        <FilterList onFilterChange={this.setAppliedFilters}
                            availableFilters={this.state.availableFilters}
                            appliedFilters={this.state.appliedFilters} />
                    </div>
                    <div className="col-12 col-md-10">
                        <div className="browser-results-container">
                            {loader}
                            <Paginator onPageChange={this.setPage}
                                       currentPage={this.state.currentPage}
                                       startIndex={this.state.startIndex}
                                       endIndex={this.state.endIndex}
                                       totalCount={this.state.totalCount}
                                       totalPages={this.state.totalPages}/>
                            <SearchResults results={this.state.results}/>
                            <Paginator onPageChange={this.setPage}
                                       currentPage={this.state.currentPage}
                                       startIndex={this.state.startIndex}
                                       endIndex={this.state.endIndex}
                                       totalCount={this.state.totalCount}
                                       totalPages={this.state.totalPages}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    getResults(pageNumber, pageUrlPrefix, appliedFilters, isSearch, searchQueryString) {
        // On update, just consume the state.
        const updateState = (state) => {
            state.isLoading = false;
            let url = this.buildUrlFromState(state.pageUrlPrefix, state.currentPage, state.isSearch,
                state.searchQueryString, state.appliedFilters);
            history.pushState(state, null, url);
            this.setState(state);
        };

        // Make AJAX request to get the page.
        let url = this.buildUrlFromState(pageUrlPrefix, pageNumber, isSearch, searchQueryString, appliedFilters);
        if (url.includes('?')) {
            url += '&isAjax=true';
        } else {
            url += '?isAjax=true'
        }

        this.setState({
            isLoading: true
        });
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: updateState,
            error: this.onError.bind(this)
        });
    }

    setPage(pageNumber) {
        this.getResults(pageNumber, this.state.pageUrlPrefix, this.state.appliedFilters, this.state.isSearch,
            this.state.searchQueryString);
    }

    setAppliedFilters(filters) {
        // Changing the filters will always put us back on page 1.
        this.getResults(1, this.state.pageUrlPrefix, filters, this.state.isSearch,
            this.state.searchQueryString);
    }

    onError() {
        this.setState({
            isLoading: false,
            error: true
        });
    }

    buildUrlFromState(pageUrlPrefix, pageNumber, isSearch, searchQueryString, appliedFilters) {
        // Build out from applied filters
        const applied = [];
        for (let filterId in appliedFilters) {
            const values = [];
            for (let value of appliedFilters[filterId]) {
                values.push(encodeURIComponent(value));
            }
            applied.push(filterId + '=' + values.join(','));
        }
        const filterQuery = applied.join('&');
        let url = pageUrlPrefix + pageNumber;
        if (isSearch) {
            url += '?q=' + searchQueryString;
            if (applied.length > 0) {
                url += '&' + filterQuery;
            }
        } else {
            if (applied.length > 0) {
                url += '?' + filterQuery;
            }
        }

        return url;
    }
}

/**
 * When DOM ready, initialize the browser.
 */
$(document).ready(function() {
    const targetElement = $('#villager-browser');
    const initialState = targetElement.attr('data-initial-state');
    ReactDOM.render(<Browser id="browser" initialState={initialState}/>, targetElement[0]);
})
