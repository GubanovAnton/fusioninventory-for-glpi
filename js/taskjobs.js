var taskjobs = {}

taskjobs.show_form = function( data, textStatus, jqXHR) {
   $('#taskjobs_form')
      .html(data);
}

taskjobs.hide_form = function () {
   $('#taskjobs_form')
      .html('');
}

taskjobs.register_update_method = function (rand_id) {

   //reset onchange event
   $("#" + rand_id ).off("change", "*");
   $("#" + rand_id ).on("change",
      function(e) {
         $("#method_selected").text(e.val);
         //reset targets and actors dropdown
         taskjobs.hide_moduletypes_dropdown();
         taskjobs.hide_moduleitems_dropdown();
         taskjobs.clear_list('targets');
         taskjobs.clear_list('actors');
      }
      );
}

taskjobs.register_update_items = function (rand_id, moduletype, ajax_url) {
   //reset onchange event
   $("#" + rand_id ).off("change", "*");
   $("#" + rand_id ).on("change",
         function(e) {
            //$("#taskjob_moduleitems_dropdown").text(e.val);
            taskjobs.show_moduleitems(ajax_url, moduletype, e.val)
         }
         );
}

taskjobs.register_form_changed = function () {
   //reset onchange event
   $("form[name=form_taskjob]" ).off("change", "*");
   $("form[name=form_taskjob]" ).on("change",
         function(e) {
            $('#cancel_job_changes_button').show();
         }
         );
}

taskjobs.create = function(ajax_url, task_id) {
   $.ajax({
      url: ajax_url,
      data: {
         "task_id" : task_id
      },
      success: taskjobs.show_form
   })
}

taskjobs.edit = function(ajax_url, taskjob_id) {
   $.ajax({
      url: ajax_url,
      data: {
         "id" : taskjob_id
      },
      success: taskjobs.show_form
   })
}

taskjobs.hide_moduletypes_dropdown = function() {
   $('#taskjob_moduletypes_dropdown')
      .html('');
}

taskjobs.show_moduletypes_dropdown = function(dropdown_dom) {
   $('#taskjob_moduletypes_dropdown')
      .html(dropdown_dom);
}

taskjobs.hide_moduleitems_dropdown = function() {
   $('#taskjob_moduleitems_dropdown')
      .html('');
}

taskjobs.show_moduleitems_dropdown = function(dropdown_dom) {
   $('#taskjob_moduleitems_dropdown')
      .html(dropdown_dom);
}

taskjobs.clear_list = function(moduletype) {
   $('#taskjob_'+moduletype+'_list')
      .html('');
}

taskjobs.delete_items_selected = function(moduletype) {
   $('#taskjob_'+moduletype+'_list')
      .find(".taskjob_item")
      .has('input[type=checkbox]:checked')
      .remove()
}

taskjobs.add_item = function (moduletype, itemtype, itemtype_name, rand_id) {
   item_id = $("#"+rand_id).val();
   item_name = $("#taskjob_moduleitems_dropdown .select2-chosen").text();
   if ( item_id > 0 ) {
      item_to_add = {
         'id' : itemtype + "-" + item_id,
         'name' : item_name
      }
      item_exists = $('#taskjob_' + moduletype + '_list').find('#'+item_to_add.id);
      if (item_exists.length == 0) {
         // Append the element to the list input
         // TODO: replace this with an ajax call to taskjobview class.
         $('#taskjob_' + moduletype + '_list')
            .append(
               "<div class='taskjob_item new' id='" + item_to_add.id + "'"+
               //"  onclick='$(this).children(\"input[type=checkbox]\").trigger(\"click\")'"+
               "  >" +
               "  <input type='checkbox'>" +
               "  </input>" +
               "  <span class='"+itemtype+"'></span>"+
               "  <label>"+
               "     <span style='font-style:oblique'>" + itemtype_name +"</span>" +
               "     "+ item_to_add.name +
               "  </label>"+
               "  <input type='hidden' name='"+moduletype+"[]' value='"+item_to_add.id+"'>" +
               "  </input>" +
               "</div>"
            );
      } else {
         item_exists.fadeOut(100).fadeIn(100);
      }
   }
}

taskjobs.show_moduletypes = function(ajax_url, moduletype) {
   taskjobs.hide_moduletypes_dropdown();
   taskjobs.hide_moduleitems_dropdown();
   $.ajax({
      url: ajax_url,
      data: {
         "moduletype" : moduletype,
         "method" : $('#method_selected').text()
      },
      success: function( data, textStatus, jqXHR) {
         taskjobs.show_moduletypes_dropdown( data )
      }
   });
}

taskjobs.show_moduleitems = function(ajax_url, moduletype, itemtype) {
   taskjobs.hide_moduleitems_dropdown();
   $.ajax({
      url: ajax_url,
      data: {
         "itemtype" : itemtype,
         "moduletype" : moduletype,
         "method" : $('#method_selected').text()
      },
      success: function( data, textStatus, jqXHR) {
         taskjobs.show_moduleitems_dropdown( data )
      }
   });
}

///////////////////////////////////////////////////////////

// Taskjobs logs refresh
// TODO: move the following in a taskjobs.view.js

taskjobs.Queue = $({
   refresh : 0,
   timer : null
});

taskjobs.unfolds = {
   targets : {},
   agents : {},
   executions : {}
}

var agents_dispatch = d3.dispatch('view');

// Agents block view

function agents_chart() {

   function chart(selection) {
      selection.each( function(data,i) {

         console.debug(data)
         var data = data;

         console.debug(data)

         var div = d3.select(this)
            .selectAll("div.agent_block")
            .data(data, function(d) { return d[0];})

         div.enter()
         .append("div");
         div.attr('class', function(d) {
               var classes = [
                  'agent_block',
               ];
               for(i=0; i < d[1].length; i++) {
                  classes.push('agent_' + d[1][i]['state']);
               }
               return classes.join(' ');
            }).each( function(d) {

               var dates = d3.select(this).selectAll('span.date').data([d]);
               dates.enter().append('span')
                  .attr('class', 'date');
               dates.text(d[1][0].last_log_date);

               var names = d3.select(this).selectAll('a.name').data([d]);

               names.enter().append('a')
                  .attr('class', 'name');
               names.exit().remove()
               names.attr('href', 'javascript:void(0)')
                  .text(taskjobs.data.agents[d[0]]);

            });
         div.exit().remove();

         div.order();

      });
   }
   return chart;
}

var do_not_display = false;

taskjobs.update_agents_view = function (chart_id) {

   if (taskjobs.agents_chart[chart_id]) {
      var chart = taskjobs.agents_chart[chart_id];

      var filtered_agents = Lazy([]);

      //Filter agents chart view
      Lazy(Object.keys(chart.type_selected))
         .each( function(d) {
            filtered_agents = filtered_agents.union(chart.counters[d]);
         });

      var agents = chart.agents.pick(filtered_agents.toArray());

      agents = agents.sortBy( function(agent) {
         var date = new Date(agent[1][0].last_log_date);
         return date.getTime();
      }).reverse();

      //taskjobs.agents_chart[chart_id].filtered_agents = filtered_agents;
      taskjobs.agents_chart[chart_id].agents_to_view = agents.toArray();
   }
   taskjobs.agents_chart[chart_id].display_agents = true;
}

taskjobs.display_agents_view = function(chart_id) {

      if(taskjobs.agents_chart[chart_id].display_agents) {
         console.debug(taskjobs.agents_chart[chart_id].display_agents);

         console.debug('refreshing view ' + chart_id + ' @ ' + new Date())
         var chart = taskjobs.agents_chart[chart_id];
         var agents = chart.agents_to_view
         console.debug(chart)

         d3.select(chart.selector)
            .datum(agents)
            .call(agents_chart());

         taskjobs.agents_chart[chart_id].display_agents = false;
      }

}


agents_dispatch.on('view', function(chart_id) {
   taskjobs.update_agents_view(chart_id);
});

taskjobs.toggle_details_type = function(element, counter_type, chart_id) {
   view = false;
   if (element._view) {
      view = element._view
   }
   //store the boolean on the <a> itself
   element._view = !view;

   if (element._view) {
      taskjobs.agents_chart[chart_id].type_selected[counter_type] = true;
   } else {
      delete taskjobs.agents_chart[chart_id].type_selected[counter_type];
   }

   $(element)
      .toggleClass('expanded',element.view);

   // Request an update
   agents_dispatch.view(chart_id)
}

// Create block element if it does not already exists
taskjobs.create_block = function(selector, parent_selector, content) {
   element = $(selector);

   if (element.length == 0) {
      $(parent_selector).append($(content).hide());
   }
}

// Update some block's content if it changed
taskjobs.update_block_content = function(selector, content, class_toggle) {
   element = $(selector);
   if ( element.length == 0 ) {
         element.html(content);
   } else {
      if ( element.html().length == 0 ) {
         element.html(content);
      } else {
         if ($(content).length > 0) {
            new_content = $(content).text().trim();
         } else {
            new_content = content.trim();
         }
         if (element.text().trim() !== new_content) {
            if ( class_toggle ) {
               element.html(content);
               classes_to_remove = Lazy(class_toggle)
                  .filter(function(d) { return d.toggle == false})
                  .map(function(d) { return d.classname })
                  .toArray().join();
               classes_to_add = Lazy(class_toggle)
                  .filter(function(d) { return d.toggle == true})
                  .map(function(d) { return d.classname })
                  .toArray().join();

               //console.debug(classes_to_remove);
               //console.debug(classes_to_add);
               element
                  .toggleClass(classes_to_add, true, 500)
                  .toggleClass(classes_to_remove,false, 500);
            } else {
               element.fadeOut(200, function() {
                  $(this).html(content).fadeIn(500, function() { $(this).css('display','')});
               })
            }
         } else {
            element[0].innerHTML = content;
         }
      }
   }
}

// Load templates
var templates = {};

taskjobs.init_templates = function() {
   templates = {
      task           : $('#template_task').html(),
      job            : $('#template_job').html(),
      target         : $('#template_target').html(),
      target_name    : $('#template_target_name').html(),
      target_stats   : $('#template_target_stats').html(),
      counter_block  : $('#template_counter_block').html(),
      counter_content: $('#template_counter_content').html(),
      agent          : $('#template_agent').html(),
   };
   Lazy(templates).each( function(d) { Mustache.parse(d); });
}

taskjobs.charts = {};
taskjobs.agents_chart = {};
// Build and update executions' logs view
taskjobs.update_logs = function (data) {

   taskjobs.data = $.parseJSON(data);
   taskjobs.compute_data();


   // The following is used to remove blocks that are not present anymore in data
   blocks_seen = {
      tasks : [],
      jobs : [],
      targets : [],
      charts : [],
      agents_chart : [],
   }
   tasks = taskjobs.data['tasks'];
   tasks_selector = '#tasks_block';
   //console.debug(tasks_placeholder);
   $.each(tasks, function(task_i, task_v) {
      task_id = 'task_' + task_v.task_id;

      task_name = task_v.task_name;
      task_selector = [tasks_selector, '#' + task_id].join(' > ');

      blocks_seen.tasks.push(task_selector);

      //console.debug(task_selector);

      taskjobs.create_block(
         task_selector,
         tasks_selector,
         Mustache.render(templates.task, {
            'task_id': task_id
         })
      );

      task_name_selector = [task_selector, 'h3', 'span.task_name'].join(' > ');
      taskjobs.update_block_content(
         task_name_selector,
         task_name
      );

      // Display Jobs
      jobs_selector = [task_selector, '.jobs_block'].join(' > ');

      //console.debug(jobs_selector);

      $.each( task_v.jobs, function(job_i, job_v) {
         job_id = job_v.id;

         job_name = job_v.name;
         job_selector = [jobs_selector, '#job_'+job_id].join(' > ');
         blocks_seen.jobs.push(job_selector);

         taskjobs.create_block(
            job_selector,
            jobs_selector,
            Mustache.render(templates.job, {
               'job_id': 'job_' + job_id
            })
         );
         job_name_selector = [job_selector,"h3.job_name"].join(' > ');
         taskjobs.update_block_content(
            job_name_selector,
            job_name
         );

         //Display Targets
         targets_selector = [job_selector, '.targets_block'].join(' > ');

         //console.debug(targets_selector);

         $.each( job_v.targets, function( target_i, target_v) {
            target_id = target_i;
            target_name = target_v.name;
            target_link = target_v.item_link;
            target_selector = [targets_selector, '#'+target_id].join(' > ');
            blocks_seen.targets.push(target_selector);


            var chart_id = 'job_' + job_v.id + '_' + target_id

            //console.debug(target_selector);

            taskjobs.create_block(
               target_selector,
               targets_selector,
               Mustache.render(templates.target, {
                  'target_id': target_id
               })
            );
            target_name_selector = [
               target_selector,
               ".target_details",
               ".target_infos",
               ".target_name"
            ].join(' > ');

            taskjobs.update_block_content(
               target_name_selector,
               Mustache.render(templates.target_name, {
                  'target_link' : target_link,
                  'target_name' : target_name
               })
            );

            // Create agents' chart data
            agents_selector = [target_selector, ".agents_block"].join(' > ');

            target_v.agents = Lazy(target_v.agents);

            //create the agents chart object if it doesn't exist
            if (!taskjobs.agents_chart[chart_id]) {
               taskjobs.agents_chart[chart_id] = {
                  selector : agents_selector,
                  type_selected : {}
               };
               d3.timer(function() {
                  taskjobs.display_agents_view(chart_id)
               }, 1000)
            }
            // update agents chart object with new data
            taskjobs.agents_chart[chart_id].agents = target_v.agents;
            taskjobs.agents_chart[chart_id].counters = target_v.counters_computed;
            agents_dispatch.view(chart_id);

            counters_selector = [
               target_selector,
               ".target_details",
               ".target_infos",
               ".target_stats"
            ].join(' > ');
            $.each( taskjobs.statuses_order, function( stats_idx, stats_key) {

               stats_type_selector = [counters_selector, "." + stats_idx].join(' > ');
               taskjobs.create_block(
                     stats_type_selector,
                     counters_selector,
                     Mustache.render(templates.target_stats, {
                        'stats_type' : stats_idx
                     })
               );

               //Display target's statistics
               $.each( stats_key , function(counter_idx, counter_key) {
                  counter_value = target_v.counters_computed[counter_key];
                  counter_type = counter_key;
                  counter_empty = (counter_value.length == 0);
                  counter_type_name = taskjobs.statuses_names[counter_type];
                  counter_selector = stats_type_selector + ' .' + counter_type;

                  //console.debug("counter_selector : " + counter_selector);

                  //task_job
                  taskjobs.create_block(
                     counter_selector,
                     stats_type_selector,
                     Mustache.render(templates.counter_block, {
                        'counter_empty' : counter_empty,
                        'counter_type' : counter_type,
                        'chart_id' : chart_id
                     })
                  );

                  counter_content_selector = counter_selector + " > a";

                  taskjobs.update_block_content(
                     counter_content_selector,
                     Mustache.render(templates.counter_content, {
                        'counter_type_name' : counter_type_name,
                        'counter_value' : counter_value.length
                     })
                  );
                  $(counter_selector)
                     .toggleClass('empty', counter_empty);

                  $(counter_selector).fadeIn(500);
                  $(stats_type_selector).fadeIn(500);
               });
            });

            var progressbar_selector = [
               target_selector,
               ".target_details",
               "div.progressbar",
            ].join(' > ');

            blocks_seen.charts.push("#chart_" + chart_id);


            if ($('#chart_' + chart_id).length == 0) {
               taskjobs.charts[chart_id] = taskjobs.create_progressbar(
                     progressbar_selector, 'chart_'+chart_id, 400,100
               );
               taskjobs.charts[chart_id].new_data = [ 0, 0, 0];
               taskjobs.update_progressbar(taskjobs.charts[chart_id]);
            }

            taskjobs.charts[chart_id].new_data = [
               target_v.counters_computed.agents_success.length,
               target_v.counters_computed.agents_error.length,
               target_v.counters_computed.agents_notdone.length
            ];

            if ( ! d3.sum(taskjobs.charts[chart_id].new_data) > 0) {
               $(progressbar_selector).toggleClass('empty',true);
            } else {
               $(progressbar_selector).toggleClass('empty',false);
            }

            $(counters_selector).fadeIn(500);
            $(target_selector).fadeIn(500);
         });
         $(job_selector).fadeIn(500);
      });
      $(task_selector).fadeIn(500);
   });

   if (taskjobs.blocks_seen) {
      cache = taskjobs.blocks_seen;
      node_to_drop = Lazy([])
         .concat(Lazy(cache.tasks).without(blocks_seen.tasks).toArray())
         .concat(Lazy(cache.jobs).without(blocks_seen.jobs).toArray())
         .concat(Lazy(cache.targets).without(blocks_seen.targets).toArray())
         .concat(Lazy(cache.charts).without(blocks_seen.charts).toArray())
      $.each(node_to_drop.toArray(), function(i,d) {
         $(d).fadeOut(500, function() {
            $(this).remove()
         });
      });
   }

   $(Object.keys(taskjobs.charts)).delay(500).each(function(i,v) {
      taskjobs.update_progressbar(taskjobs.charts[v]);
   });

   //taskjobs.update_agents_view()

   taskjobs.blocks_seen = blocks_seen;
//   taskjobs.update_folds(tasks_placeholder);
}



taskjobs.compute_data = function() {
    //target_debug = "";
    tasks = taskjobs.data['tasks'];
    result = [];
    $.each(tasks, function(task_i, task_v) {
        task = tasks[task_i];
        $.each(task.jobs, function( job_i, job_v) {
            job = task.jobs[job_i];
            $.each(job.targets, function( target_i, target_v) {
                target_v.counters_computed = {
                    agents_prepared:   Object.keys(target_v.counters.agents_prepared),
                    agents_running:    Object.keys(target_v.counters.agents_running),
                    agents_cancelled:  Object.keys(target_v.counters.agents_cancelled),
                    agents_notdone:    Object.keys(target_v.counters.agents_notdone),
                    agents_error:      Object.keys(target_v.counters.agents_error),
                    agents_success:    Object.keys(target_v.counters.agents_success)
                }
                counters = target_v.counters_computed;
                //counters.agents_obsolete = Lazy(counters.agents_notdone).intersection(counters.agents_cancelled).toArray();
                //counters.agents_notdone = Lazy(counters.agents_notdone).without(counters.agents_obsolete).toArray();
                counters.agents_notdone = Lazy(counters.agents_notdone).toArray();
                counters.agents_total =
                    Lazy(counters.agents_success).
                        union(counters.agents_error).
                        toArray();

                //target_debug += "•" + target_v.name + "\n";
                //target_debug += "prepared     : " + counters.agents_prepared.length + "\n";
                //target_debug += "running      : " + counters.agents_running.length + "\n";
                //target_debug += "cancelled    : " + counters.agents_cancelled.length + "\n";
                //target_debug += "error        : " + counters.agents_error.length + "\n";
                //target_debug += "success      : " + counters.agents_success.length + "\n";
                //target_debug += "not done yet : " + counters.agents_notdone.length + "\n";
                //target_debug += "obsolete     : " + counters.agents_obsolete.length + "\n";
                //target_debug += "total        : " + counters.agents_total.length + "\n";
                //percent_success = ((counters.agents_success.length / counters.agents_total.length) * 100).toFixed(2);
                //percent_failed = ((counters.agents_error.length / counters.agents_total.length) * 100).toFixed(2);
                //target_debug += percent_success + " % success\n";
                //target_debug += percent_failed + " % failures\n";
            });
        });
    } );
    //console.log(target_debug);
    //$('.debuglogs').text(target_debug);
}

// Charts functions
// TODO: refactor those functions by defining a reusable chart object in order to simplify usage
// (cf. http://bost.ocks.org/mike/chart/)

taskjobs.create_progressbar = function(node_container, chart_id, width, height) {
   var chart = d3.select(node_container)
      .append('svg')
      .attr('id', chart_id)
      .attr("class", "chart")
      .attr("width", width)
      .attr("height", height)
   origin = chart.append("g")
      .attr("transform", "translate(" + width / 2 + "," + height + ")");

   origin.append("g")
      .attr('class', 'arcs');
   origin.append("g")
      .attr('class', 'pointers');
   origin.append("g")
      .attr('class', 'texts');
   chart._width = width;
   return chart;
}

// TODO: put the following in the reusable object
taskjobs.update_progressbar = function( chart ) {

   var data = chart.new_data;

   //var total = 1000000000;
   //var success = (Math.floor(Math.random() * 2)) * Math.floor(Math.random()*total).toFixed(0);
   //var error = (Math.floor(Math.random() * 2)) * Math.floor(Math.random()*(total - success)).toFixed(0);
   //var notdone = total - (success + error).toFixed(0);

   //var data = [
   //   success,
   //   error,
   //   notdone
   //      ];

   remapped = [];
   var x0 = 0;
   var total = d3.sum(data);
   var pi = Math.PI;
   if (total > 0) {
      data.forEach( function(d, i){
         t = Math.ceil((d/total)*16);
            remapped.push({
               real : d,
               value: t.toFixed(0),
               index: i,
               x0 : x0,
               x1: x0 += +t
            });
      });
      chart.style('display', '');
   } else {
      chart.style('display', 'none');
   }

   var  radius = 80;

   var percent = d3.scale.linear()
      .domain([0,total])
      .range([0,100]);

   var color = d3.scale.ordinal()
      .domain([0,1,2])
      .range(['#8F8', '#F33', '#ccc']);

   var color_stroke = d3.scale.ordinal()
      .domain([0,1,2])
      .range(['#0A0','#A00','#777']);

   var format = d3.format('.1s');

   var pie = d3.layout.pie()
      .value(function(d,i) {
         if ( total > 0 ) {
            return d.value;
         } else {
            if ( i == 3 ) {
               return 100;
            }
         }
      })
      .sort(null)
      .startAngle(-90 * (pi / 180))
      .endAngle(90 * (pi / 180));

   var arc = d3.svg.arc()
      .innerRadius(radius - 25)
      .outerRadius(radius);

   var arcs = chart.select('g.arcs').selectAll('path.arc').data(pie(remapped));

   var text_repartition = {
      left: [],
      right: []
   };

   //create new arcs' paths
   arcs.enter().append('path')
      .attr('class','arc')
      .attr('fill',function(d,i) {
         return color(i);
      })
      .each( function(d) {
         this._current = d;
      });

   var dispatcher = d3.dispatch('newangle');

   arcTween = function(a) {
      var interpolate  = d3.interpolate(this._current, a);
      this._current = interpolate(0);
      return function(t) {
         i = interpolate(t);
         return arc(interpolate(t));
      }
   }

   //update arcs
   arcs.transition().duration(500)
      .attrTween("d", arcTween);

   arcs.exit().remove()
   //console.debug(repartition);
//   var text = chart.selectAll('text').data(pie(remapped));
//   text.enter().append('text')
////      .attr('x',function(d) { return pie(x(d.data.x1 - d.data.x0/2))} )
//      .attr('y',0);
//   text.text(function(d) {console.debug(d);return d.data.index});


//  chart.selectAll("rect") // this is what actually creates the bars
//    .data(remapped)
//  .enter()
//    .append("rect")
//    .attr("x", function(d) { console.log(d);return 40 + x(d.x0)})
//    .attr("y", 20)
//    .attr("width", function(d) { return x(d.x1 - d.x0)})
//    .attr("height", 10)
//    .style("fill", function(d) { return color(d.index);})
//    .each(function(d) {
//      d.cx = 40 + x( d.x0 + (d.x1 - d.x0)/2);
//    });

   cursorposTween = function(a) {
      var interpolate = d3.interpolate(this._current, a);
      this._current = interpolate(0);
      return function(t) {
         return 'translate(' + arc.centroid(interpolate(t)) + ')';
      }
   }

   var cursor = chart.select('g.texts').selectAll('text').data(pie(remapped));

   cursor.enter().append('text')
      .attr('text-anchor','middle')
      .attr('font-size', '0.5em')
      .each(function(d) { this._current = d } );

   cursor.text( function(d) {
         return percent(d.data.real).toFixed(1)
      })

   // Do not display value when there are none;
   cursor
      .attr('display', function(d) {
         return ((d.data.value > 0) ? '' : 'none');
      })

   cursor.each(function(d) {
      //console.debug(JSON.stringify(this._current));
      //console.debug(JSON.stringify(this.getBBox()));
   });

   cursor.transition().duration(500)
      .attrTween('transform', cursorposTween);

   cursor.exit().remove();

//    .enter().append("text")
//    .attr('x', function(d) {
//          if(d.index % 2 == 0) {
//          d.anchor = "start";
//          } else {
//          d.anchor = "end";
//          }
//          return d.x = 0;
//    })
//    .attr('y', function(d) {
//        d.cy = 25;
//        return d.y = (d.index % 2 == 0) ? 10 : 45
//    })
//    .attr('text-anchor', function(d) { return d.anchor}) // text-align: right
//    .attr('font-size','10px')
//    .attr('font-weight', 'bolder')
//    .attr('fill', function(d) {return color_stroke(d.index)})
//    .text(function(d) {return ""+format(d.value)+" ("+percent(d.value).toFixed(1)+"%)" })
//    .each(function(d) {
//        var bbox = this.getBBox();
//        if (d.index % 2 == 0) {
//        d.sx = d.cx - bbox.width - 2;
//        d.ox = d.sx + bbox.width + 2;
//        } else {
//        d.sx = d.cx + bbox.width + 2;
//        d.ox = d.sx - bbox.width - 2;
//        }
//        d.sy = d.oy = d.y + 5;
//        })
//    .attr('x', function(d) {
//        if (d.sx < 0 ) {
//          return 0
//        } else {
//        return d.sx
//        }
//      });
//
//    chart.selectAll("path.pointer").data(remapped).enter()
//        .append("path")
//        .attr("class", "pointer")
//        .attr("stroke-width", 0.5)
//        .attr("stroke-linecap", "round")
//        .style("fill", "none")
//        .style("stroke", function(d) {return color_stroke(d.index)})
//        .attr("d", function(d) {
//                return "M" + d.sx + "," + d.sy + "L" + d.ox + "," + d.oy + " " + d.cx + "," + d.cy;
//            });
}


taskjobs.get_logs = function( ajax_url, task_id ) {
   $('#refresh_button').find('span').toggleClass('loading', true).text('Refreshing ...');
   $.ajax({
      url: ajax_url,
      data: {
         "task_id" : task_id
      },
      success: function( data, textStatus, jqXHR) {
         taskjobs.update_logs(data);
      },
      complete: function( ) {
         taskjobs.Queue.queue("refresh_logs").pop();
         $('#refresh_button').find('span').toggleClass('loading', false).text('Manual refresh');
      }
   });
}

taskjobs.init_refresh_form = function( ajax_url, task_id, refresh_id) {
   $('#refresh_button')
      .on('click', function(e) {
         console.debug(e.target);
         taskjobs.update_logs_timeout( ajax_url, task_id, refresh_id )
      });

   $("#"+ refresh_id)
      .on("change", function() {
         taskjobs.update_logs_timeout( ajax_url, task_id, refresh_id )
      }
   );

}

taskjobs.update_logs_timeout = function( ajax_url, task_id , refresh_id) {


   taskjobs.refresh = $("#" + refresh_id).val();

   window.clearTimeout(taskjobs.Queue.timer);
   taskjobs.queue_refresh_logs(ajax_url, task_id);

   if (taskjobs.refresh != 'off') {
      taskjobs.Queue.refresh = taskjobs.refresh * 1000;
      taskjobs.Queue.timer = window.setInterval(
         function () {
            taskjobs.queue_refresh_logs(ajax_url, task_id);
         },
      taskjobs.Queue.refresh);
   } else {
      window.clearTimeout(taskjobs.Queue.timer);
   }
}

taskjobs.queue_refresh_logs = function (ajax_url, task_id) {
   var n = taskjobs.Queue.queue('refresh_logs');

   if ( $("#tasks_block:visible").length == 0 ) {
      window.clearTimeout(taskjobs.Queue.timer);
   }
   if (n.length == 0 ) {
      taskjobs.Queue.queue('refresh_logs', function( ) {
         taskjobs.get_logs(ajax_url, task_id);
      })
      taskjobs.Queue.queue('refresh_logs')[0]();
   }
}
