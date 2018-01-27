from flask import Flask, render_template
from flask_login import LoginManager
import datetime as dt
import time
import json
#import sys

import numpy as np
import pandas as pd
#import holoviews as hv
#from bokeh.embed import components

import pygsheets as pyg

#hv.extension('bokeh')
#renderer = hv.renderer('bokeh')
app = Flask(__name__)
login_manager = LoginManager()
login_manager.init_app(app)


def dateDataList(df, col=None):
    if col is not None:
        return list(zip([int(time.mktime(d.timetuple()))*1000 for d in df.index], df[col]))
    else:
        return list(zip([int(time.mktime(d.timetuple()))*1000 for d in df.index], df))

@app.route("/u/<string:user>/")
def dashboard(user):

    gc = pyg.authorize(no_cache=True)
    spreadsheet = gc.open("Habit Tracker")
    sheet = spreadsheet.worksheet_by_title(user)
    data = sheet.get_all_values()
    data = pd.DataFrame(data[1:], columns=data[0], dtype="int")
    data = data.set_index(pd.DatetimeIndex(pd.to_datetime(data["Date"] + ", 2018", infer_datetime_format=True)))
    data = data.drop("Date", axis=1)
    try:
        data = data.drop("Sum", axis=1)
    except ValueError:
        try:
            data = data.drop("Total", axis=1)
        except ValueError:
            pass

    
    data = data[:dt.date.today()]
    data = data.apply(pd.to_numeric).fillna(0)
    category_totals = data.sum(axis=0)
    daily_totals = data.sum(1)

    bar_chart = {"chart": {"type": 'column'},
                    "title": {"text": 'Total Completions'},
                    "xAxis": {'type': 'category', 'labels': {'rotation': -45}},
                    'series': [{'name': 'Habits', "data": list(category_totals.items()),
                                'dataLabels': {
                                    'enabled': True,
                                    'rotation': -90,
                                    'color': "#FFFFFF",
                                    'align': 'right',
                                    'y': 10}
                            }]
                }

    cumsum = data.cumsum(0)
    progress_chart = {
        "chart": {
            'zoomType': 'x'    
        },
        'title': {
            'text':"Habit Totals"
        },

        'plotOptions':{
            'series':{
                'marker':{
                    'enabled': False
                }
            }
        },
        'xAxis': {
            'type': 'datetime'
        },
        'yAxis': {
            'title': {
                'text': 'Habit Score'
            }
        },
        'legend': {
            'enabled': True
        },
        'series': [{'type': 'spline', 'name': col, 'data': dateDataList(cumsum, col)} for col in cumsum]
    }

    stacked_chart = {
        'chart': {
            'type': 'column',
            'zoomType': 'x'
        },
        'plotOptions': {
            "column": {
                "stacking": 'normal'
            }
        },
        'title': {
            'text': 'Habits by Day'
        },
        'xAxis': {
            'type': 'datetime'
        },
        'legend': {
            'enabled': True
        },
        # 'series': [{'name': col, 'data': list(zip([int(time.mktime(d.timetuple()))*1000 for d in data.index], data[col]))} for col in data]
        'series': [{'name': col, 'data': dateDataList(data, col)} for col in data]
    }

    daily_chart = {
        "chart": {
            'zoomType': 'x'    
        },
        'title': {
            'text':"Daily Habit Score"
        },

        'plotOptions':{
            'series':{
                'marker':{
                    'enabled': False
                }
            },
        },
        'xAxis': {
            'type': 'datetime'
        },
        'legend': {
            'enabled': True
        },
        'series': [{'type': 'area', 'name': "Daily Score", 'data': dateDataList(daily_totals)}]
    }

    f = open('output.txt', 'w')
    f.write(str(dateDataList(daily_totals)))
    f.close()
    bar_chart = json.dumps(bar_chart)
    progress_chart = json.dumps(progress_chart, default=dt.date.isoformat)
    stacked_chart = json.dumps(stacked_chart)
    daily_chart = json.dumps(daily_chart)
    chart_table = [[("cat_totals", bar_chart), ("stacked_chart", stacked_chart)], 
                   [("prog_chart", progress_chart), ("daily_chart", daily_chart)]]

    return render_template("dashboard.html", user=user, charts=chart_table)

if __name__ == "__main__":
    app.run(debug=True)

