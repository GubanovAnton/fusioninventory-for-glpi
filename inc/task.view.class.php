<?php

/*
   ------------------------------------------------------------------------
   FusionInventory
   Copyright (C) 2010-2013 by the FusionInventory Development Team.

   http://www.fusioninventory.org/   http://forge.fusioninventory.org/
   ------------------------------------------------------------------------

   LICENSE

   This file is part of FusionInventory project.

   FusionInventory is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   FusionInventory is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with FusionInventory. If not, see <http://www.gnu.org/licenses/>.

   ------------------------------------------------------------------------

   @package   FusionInventory
   @author    David Durieux
   @co-author Kevin Roy
   @copyright Copyright (c) 2010-2014 FusionInventory team
   @license   AGPL License 3.0 or (at your option) any later version
              http://www.gnu.org/licenses/agpl-3.0-standalone.html
   @link      http://www.fusioninventory.org/
   @link      http://forge.fusioninventory.org/projects/fusioninventory-for-glpi/
   @since     2010

   ------------------------------------------------------------------------
 */

class PluginFusioninventoryTaskView extends PluginFusioninventoryCommonView {

   function __construct() {
      parent::__construct();
      $this->base_urls = array_merge( $this->base_urls, array(
         'fi.job.logs' => $this->getBaseUrlFor('fi.ajax') . "/taskjob_logs.php",
      ));
   }

   function getTabNameForItem(CommonGLPI $item, $withtemplate=0) {
      global $CFG_GLPI;

      $tab_names = array();

      if ( $this->can("task", "r") ) {
         if ($item->getType() == 'Computer') {
            $tab_names[] = __('FusInv', 'fusioninventory').' '. _n('Task', 'Tasks', 2);
         }
      }

      if (!empty($tab_names)) {
         return $tab_names;
      } else {
         return '';
      }
   }

   function defineTabs($options=array()){
      global $CFG_GLPI;
      $ong = array();

      $this->addDefaultFormTab($ong);

      return $ong;
   }

   static function displayTabContentForItem(CommonGLPI $item, $tabnum=1, $withtemplate=0) {
      if ($item->getType() == 'Computer') {
         echo "<b>To Be Done</b>";
      }
   }


   function showJobLogs() {

      $refresh_intervals = array(
         "off" => __('Off', 'fusioninventory'),
         "1"   => '1 ' . _n('second','seconds',1),
         "5"   => '5 ' . _n('second','seconds',5),
         "10"  => '10 ' . _n('second', 'seconds', 10),
         "60"  => '1 ' . _n('minute', 'minutes', 1),
         "120"  => '2 ' . _n('minute', 'minutes', 2),
         "300"  => '5 ' . _n('minute', 'minutes', 5),
         "600"  => '10 ' . _n('minute', 'minutes', 10),
      );
      echo "<div class='fusinv_panel'>";
      echo "   <div class='fusinv_form large'>";
      $refresh_randid = $this->showDropdownFromArray(
         __("refresh interval", "fusioninventory"),
         null,
         $refresh_intervals,
         array(
            'value' => 'off', // set default to 10 seconds
            'width' => '20%'
         )
      );
      echo "   </div>"; // end of fusinv_form

      // Add a manual refresh button
      echo "   <div class='fusinv_form large'>";
      echo "      <div id='refresh_button' class='button'>";
      echo "      <span></span></div>";
      echo "   </div>";
      echo "</div>"; // end of fusinv_panel

      $pfTaskjob = new PluginFusioninventoryTaskjob();
      $taskjobs = $pfTaskjob->find(
         "`plugin_fusioninventory_tasks_id`='".$this->fields['id']."'",
         "id"
      );

      // Template structure for tasks' blocks
      echo implode("\n", array(
         "<script id='template_task' type='x-tmpl-mustache'>",
         "<div id='{{task_id}}' class='task_block'>",
         "  <h3>".__("Task",'fusioninventory')." <span class='task_name'></span></h3>",
         "  <div class='jobs_block'></div>",
         "</div>",
         "</script>"
      ));

      // Template structure for jobs' blocks
      echo implode("\n", array(
         "<script id='template_job' type='x-tmpl-mustache'>",
         "<div id='{{job_id}}' class='job_block'>",
         "  <h3 class='job_name'></h3>",
         "  <div class='targets_block'></div>",
         "</div>",
         "</script>"
      ));

      // Template structure for targets' blocks
      echo implode("\n", array(
         "<script id='template_target' type='x-tmpl-mustache'>",
         "<div id='{{target_id}}' class='target_block'>",
         "  <div class='target_details'>",
         "  <div class='target_infos'>",
         "     <h4 class='target_name'>",
         "     </h4>",
         "     <div class='target_stats'>",
         "     </div>",
         "  </div>",
         "  <div class='progressbar'></div>",
         "  </div>",
         "  <div class='agents_block'></div>",
         "</script>"
      ));

      // Template structure for targets' statistics
      echo implode("\n", array(
         "<script id='template_target_stats' type='x-tmp-mustache'>",
         "  <div class='{{stats_type}} stats_block'>",
         "  </div>",
         "</script>",
      ));

      // Template content for targets' name
      echo implode("\n", array(
         "<script id='template_target_name' type='x-tmpl-mustache'>",
         "<a target='_blank' href={{target_link}}>",
         "  {{target_name}}",
         "</a>",
         "</script>",
      ));

      // Template for counters' blocks
      echo implode("\n", array(
         "<script id='template_counter_block' type='x-tmpl-mustache'>",
         "<div class='counter_block {{counter_type}} {{#counter_empty}}empty{{/counter_empty}}'>",
         "<a",
         "  href='javascript:void(0)'",
         "  class='' ",
         "  title='".__("Show/Hide details","fusioninventory")."'",
         "  onclick='taskjobs.toggle_details_type(this, \"{{counter_type}}\", \"{{chart_id}}\")'",
         ">",
         "</a>",
         "</div>",
         "</script>"
      ));

      echo implode("\n", array(
         "<script id='template_counter_content' type='x-tmpl-mustache'>",
         "<div class='fold'></div>",
         "<span class='counter_name'>{{counter_type_name}}</span>",
         "<span class='counter_value'>{{counter_value}}</span>",
         "</script>"
      ));

      /*
       * List of counter names
       */
      echo implode("\n", array(
         "<script type='text/javascript'>",
         "  taskjobs.statuses_order = {",
         "     last_executions : [",
         "        'agents_prepared',",
         "        'agents_running',",
         "        'agents_cancelled'",
         "     ],",
         "     last_finish_states : [",
         "        'agents_notdone',",
         "        'agents_success',",
         "        'agents_error'",
         "     ]",
         "  };",
         "  taskjobs.statuses_names = {",
         "     'agents_notdone'   : '". __('Not done yet', 'fusioninventory')."',",
         "     'agents_error'     : '". __('In error', 'fusioninventory') . "',",
         "     'agents_success'   : '". __('Successful', 'fusioninventory')."',",
         "     'agents_running'   : '". __('Running', 'fusioninventory')."',",
         "     'agents_prepared'  : '". __('Prepared' , 'fusioninventory')."',",
         "     'agents_cancelled' : '". __('Cancelled', 'fusioninventory')."',",
         "  };",
         "</script>",
      ));

      // Template for agents' blocks
      echo implode("\n", array(
         "<script id='template_agent' type='x-tmpl-mustache'>",
         "<div class='agent_block' id='{{agent_id}}'>",
         "  <div class='status {{status.last_exec}}'></span>",
         "  <div class='status {{status.last_finish}}'></span>",
         "</div>",
         "</script>"
      ));

      // Display empty block for each jobs display which will be rendered later by mustache.js
      echo implode("\n", array(
         "<div id='tasks_block'>",
         "</div>",
//         "<pre class='debuglogs' style='text-align:left;'></pre>"
      ));

      echo implode( "\n", array(
         "<script type='text/javascript'>",
         "  taskjobs.init_templates();",
         "  taskjobs.init_refresh_form(",
         "     '".$this->getBaseUrlFor('fi.job.logs')."',",
         "     ".$this->fields['id'].",",
         "     'dropdown_".$refresh_randid."'",
         "  );",
         "  taskjobs.update_logs_timeout(",
         "     '".$this->getBaseUrlFor('fi.job.logs')."',",
         "     ".$this->fields['id'].",",
         "     'dropdown_".$refresh_randid."'",
         "  );",
         "</script>"
      ));
   }

   function ajaxGetJobs($options) {

   }

   // TODO: Move this method in task.class
   function ajaxGetJobLogs($options) {

//      $task->getFromDB($options['task_id']);

      $logs = $this->getJoblogs(array($options['task_id']));
      echo json_encode($logs);
      return;

      $display_list = array();
      $display_list[] = "<ul class='job_list'>";

      foreach($logs as $task) {
         foreach($task['jobs'] as $job) {
            $job_id = "job_".$job['id'];
            $display_list[] = "<li class='job_info' id='".$job_id."'>";
            $display_list[] = "  <h3>".$job['name']."</h3>";
            foreach($job['targets'] as $target) {

               $counters = $target['counters'];
               $target_id = $job_id."_target_".$target['id'];
               $display_list[] = " <div class='job_target' id='".$target_id."'>";

               // Target Title
               $display_list[] = "<h4>";
               $display_list[] = " ".$target['type_name'] ;
               $display_list[] = " <a ";
               $display_list[] = "  target='_blank' href='".$target['item_link']."'";
               $display_list[] = " >";
               $display_list[] = "  ".$target['name'];
               $display_list[] = " </a>";
               $display_list[] = " <span>(ID:" . $target['id'] . ")</span>";
               $display_list[] = "</h4>";

               $stats_lines = array(
                  array(
                     "agents_prepared",
                     "agents_cancelled",
                     "agents_running"
                  ),
                  array(
                     "agents_success",
                     "agents_error",
                     "agents_notdone"
                  )
               );

               foreach($stats_lines as $stat_line) {

                  $display_list[] = "     <div class='stats'>";

                  foreach($stat_line as $type) {

                     $list = $counters[$type];
                     $css = count($list)?"":"empty";

                     $display_list[] = " <a";
                     $display_list[] = "  class='$type $css'";
                     $display_list[] = "  title='".__("Show/Hide Target details","fusioninventory")."'";
                     $display_list[] = "  onclick='taskjobs.toggle_target_fold(this)'";
                     $display_list[] = " >";
                     $display_list[] =
                        $this->getCounterTypeName($type)." : " . count($list);
                     $display_list[] = " </a>";
                  }

                  $display_list[] = "     </div>";

               }

               $display_list[] = "  <ul class='agents_block'>";
               $display_list = array_merge(
                  $display_list,
                  $this->getAgentsLogs($target['agents'],$counters, $target_id)
               );
               $display_list[] = "  </ul>";
               $display_list[] = "  </div>";

            }

            $display_list[] = "</li>"; // end of job_info

         }

      }

      $display_list[] = "</ul>";

      echo implode("\n", $display_list);

   }

   function getCounterTypeName($type = "") {
      $typenames = array(
         "agents_notdone"   => __('Not done yet', 'fusioninventory'),
         "agents_error"     => __('In error', 'fusioninventory'),
         "agents_success"   => __('Successful', 'fusioninventory'),
         "agents_running"   => __('Running', 'fusioninventory'),
         "agents_prepared"  => __('Prepared' , 'fusioninventory'),
         "agents_cancelled" => __('Cancelled', 'fusioninventory')
      );

      if ( isset($typenames[$type]) ) {
         return $typenames[$type];
      } else {
         return __("N/A");
      }
   }

   function getAgentsLogs($agents = array(), $counters = array(), $target_id = "") {
      $display_list = array();
      $display_list[] = "<div class='job_agents'>";
      $display_list[] = "<ul>";

      foreach ( $agents as $agent ) {
         $agent_id = $target_id . "_agent_".$agent['id'];
         $display_tags = array();
         $agent_css = array();
         foreach($counters as $type=>$list) {
            if ( isset( $list[$agent['id']] ) ) {
               $display_tags[] = "<span class='".$type."'>";
               $display_tags[] = $this->getCounterTypeName($type);
               $display_tags[] = "</span>";
               //if( in_array($type, array("agents_error", "agents_success", "agents_notdone")) ) {
                  $agent_css[] = $type;
               //}
            }
         }
         $display_list[] = "<li class='".implode(" ", $agent_css)."'>";
         $display_list[] = "<div class='agent_block' id='".$agent_id."'>";
         //Add fold/unfold icon
         $display_list[] = " <div ";
         $display_list[] = "  class='fold'";
         $display_list[] = "  title='".__("Show/Hide Agent details","fusioninventory")."'";
         $display_list[] = "  onclick='taskjobs.toggle_agent_fold(this)'";
         $display_list[] = " ></div>";

         $display_list[] = "<a target='_blank' href='".$agent['url']."'>";
         $display_list[] = $agent['name'];
         $display_list[] = "</a>";
         $display_list = array_merge($display_list, $display_tags);
         $display_list[] = "</div>"; //end of .agent_block
         $display_list[] = "<div class='runs_block'>";
         foreach( $agent['runs'] as $run) {
            $display_list = array_merge($display_list, $this->getRunLogs($run));
         }
         $display_list[] = "</div>"; //end of .run_block
         $display_list[] = "</li>";
      }
      $display_list[] = "</ul>";
      $display_list[] = "</div>";

      return $display_list;
   }

   function getRunLogs($run = array()) {

      $logClass = new PluginFusioninventoryTaskjoblog();
      $display = array();
      $display[] = "<div class='run_block'>";
      $display[] = " <h4>" . __('Execution', 'fusioninventory')." ".$run['uniqid']."</h4>";
      $display[] = " <table class='logs_block'>";
      foreach( $run['logs'] as $log) {
         $css_state = $logClass::getStateCSSName($log['state']);
         $state_name = $logClass::getStateName($log['state']);
         $display[] = "<tr>";
         $display[] = "    <td class='log_date'>".$log['date']."</td>";
         $display[] = "    <td class='log_state'>";
         $display[] = "       <span class='".$css_state."'>".$state_name."</span>";
         $display[] = "    </td>";
         $display[] = "   <td class='log_comment'>".$log['comment']."</td>";
         $display[] = "</tr>";
      }
      $display[] = " </table>";
      $display[] = "</div>";
      return $display;
   }

   /**
    * Display form for task configuration
    *
    * @param $items_id integer ID of the task
    * @param $options array
    *
    * @return bool TRUE if form is ok
    *
    **/
   function showForm($id, $options=array()) {
      $pfTaskjob = new PluginFusioninventoryTaskjob();

      $taskjobs = array();
      $new_item = false;

      if ($id > 0) {
         $this->getFromDB($id);
         $taskjobs = $pfTaskjob->find("`plugin_fusioninventory_tasks_id`='".$id."'", "id");
      } else {
         $this->getEmpty();
         $new_item = true;
      }


      $options['colspan'] = 2;
      $this->initForm($id,$options);
      $this->showFormHeader($options);


      echo "<tr class='tab_bg_1'>";
      echo "<td colspan='4'>";
      echo "<div class='fusinv_form'>";

      $this->showTextField( __('Name'), "name");
      $this->showTextArea(__('Comments'), "comment");
      echo "</div>";
      if ( ! $new_item ) {
         echo "<div class='fusinv_form'>";
         $this->showCheckboxField( __('Active'), "is_active" );

         $datetime_field_options = array(
            'timestep' => 1,
            'maybeempty' => true,
         );
         $this->showDateTimeField(
            __('Schedule start', 'fusioninventory'),
            "datetime_start",
            $datetime_field_options
         );

         $this->showDateTimeField(
            __('Schedule end', 'fusioninventory'),
            "datetime_end",
            $datetime_field_options
         );

         $this->showDropdownForItemtype(
            __('Timeslot','fusioninventory'),
            "PluginFusioninventoryTimeslot",
            array('value' => $this->fields['plugin_fusioninventory_timeslots_id'])
            );
         echo "</div>";
      }

      echo "</div>";
      echo "</td>";
      echo "</tr>";
      $this->showFormButtons($options);

      return true;
   }


   public function submitForm($postvars) {

      if (isset($postvars['forcestart'])) {
         Session::checkRight('plugin_fusioninventory_task', UPDATE);

         /**
          * TODO: forcing the task execution should be done in the task object
          */
         $pfTaskjob = new PluginFusioninventoryTaskjob();

         $pfTaskjob->forceRunningTask($postvars['id']);

         Html::back();

      } else if (isset ($postvars["add"])) {

         Session::checkRight('plugin_fusioninventory_task', CREATE);

         $items_id = $this->add($postvars);

         Html::redirect(str_replace("add=1", "", $_SERVER['HTTP_REFERER'])."?id=".$items_id);

      } else if (isset($postvars["purge"])) {

         Session::checkRight('plugin_fusioninventory_task', PURGE);

         $pfTaskJob = new PluginFusioninventoryTaskjob();

         $taskjobs = $pfTaskJob->find("`plugin_fusioninventory_tasks_id` = '".$postvars['id']."' ");

         foreach ($taskjobs as $taskjob) {
            $pfTaskJob->delete($taskjob);
         }

         $this->delete($postvars);
         Html::redirect(Toolbox::getItemTypeSearchURL(get_class($this)));

      } else if (isset($_POST["update"])) {

         Session::checkRight('plugin_fusioninventory_task', UPDATE);

         $this->getFromDB($postvars['id']);

         //Ensure empty value are set to NULL for datetime fields
         if( isset($postvars['datetime_start']) and $postvars['datetime_start'] === '') {
            $postvars['datetime_start'] = 'NULL';
         }
         if( isset($postvars['datetime_end']) and $postvars['datetime_end'] === '') {
            $postvars['datetime_end'] = 'NULL';
         }
         $this->update($postvars);

         Html::back();
      }
   }
}